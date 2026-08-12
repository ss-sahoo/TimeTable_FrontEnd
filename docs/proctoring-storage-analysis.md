# Proctoring Snapshot Storage Analysis

## Current Implementation

### How Snapshots Are Stored
- **Location**: `ExamProctoring.snapshots` (JSONField in PostgreSQL)
- **Format**: Base64-encoded JPEG images stored as JSON array
- **Size per snapshot**: ~50-200 KB (depending on image quality/resolution)
- **Frequency**: Every 30 seconds by default (configurable)

### Storage Math

**Per Exam Attempt:**
- Average exam duration: 80 minutes
- Snapshots per exam: 80 min × 60 sec / 30 sec = **160 snapshots**
- Average size per snapshot: 100 KB
- **Total per attempt: ~16 MB**

**At Scale:**
- 100 students taking exams simultaneously: **1.6 GB**
- 1,000 students per day: **16 GB/day**
- 30,000 students per month: **480 GB/month**

## Problems with Current Approach

1. **Database Bloat**: JSON fields with large base64 strings slow down:
   - Database backups
   - Query performance
   - Index operations
   - Migration times

2. **Cost**: PostgreSQL storage is expensive compared to object storage (S3, etc.)

3. **Retrieval**: Loading entire `ExamProctoring` records becomes slow when snapshots array is large

4. **No Cleanup**: Snapshots accumulate indefinitely unless manually purged

## Recommended Solutions

### Option 1: File Storage + Database References (BEST)
**Store images as files, only save metadata in DB**

```python
# In upload_snapshot view:
from django.core.files.base import ContentFile
import base64

# Decode and save as file
image_data = base64.b64decode(serializer.validated_data['image_data'])
file_name = f"snapshots/attempt_{attempt_id}/{timestamp}.jpg"
attempt.proctoring.snapshot_files.create(
    file=ContentFile(image_data, name=file_name),
    timestamp=timestamp,
    metadata=metadata
)

# Store only reference in JSON
snapshot_info = {
    'file_path': file_name,
    'timestamp': timestamp.isoformat(),
    'metadata': metadata,
    'analysis': analysis
}
```

**Benefits:**
- Database stays lean (only file paths stored)
- Can use S3/cloud storage for scalability
- Easy to implement retention policies (delete files older than X days)
- Faster queries and backups

**Storage Model:**
```python
class ProctoringSnapshot(models.Model):
    proctoring = models.ForeignKey(ExamProctoring, related_name='snapshot_files')
    file = models.ImageField(upload_to='proctoring/snapshots/')
    timestamp = models.DateTimeField()
    metadata = models.JSONField(default=dict)
    analysis = models.JSONField(default=dict)
    
    class Meta:
        indexes = [
            models.Index(fields=['proctoring', '-timestamp']),
        ]
```

### Option 2: Selective Storage (SMART)
**Only store snapshots when violations detected**

```python
# In upload_snapshot view:
if analysis.get('violations'):
    # Store snapshot (violation detected)
    proctoring.snapshots.append(snapshot_info)
else:
    # Just log metadata, discard image
    proctoring.snapshot_metadata.append({
        'timestamp': timestamp,
        'faces_detected': analysis.get('faces_detected', 0),
        'no_violations': True
    })
```

**Benefits:**
- Reduces storage by ~90% (most snapshots have no violations)
- Still maintains audit trail
- Keeps current JSON structure

### Option 3: Compression + Retention
**Compress images and auto-delete old snapshots**

```python
from PIL import Image
import io

# Compress before storing
img = Image.open(io.BytesIO(base64.b64decode(image_data)))
img = img.resize((320, 240), Image.Resampling.LANCZOS)  # Downscale
buffer = io.BytesIO()
img.save(buffer, format='JPEG', quality=60, optimize=True)
compressed_data = base64.b64encode(buffer.getvalue()).decode()

# Store compressed version
snapshot_info['image_data'] = compressed_data  # Now ~20-30 KB instead of 100 KB
```

**Plus cleanup job:**
```python
# Management command: cleanup_old_snapshots.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=90)  # Keep 90 days
        # Delete snapshots older than cutoff
        # Or move to cold storage
```

## Implementation Status

✅ **Option 2 (Selective Storage) - IMPLEMENTED**
- Full snapshots stored only when violations detected
- Metadata-only snapshots for clean captures
- Estimated storage reduction: ~90%
- See `exam_flow_backend/exams/views.py` `upload_snapshot()` function

## Immediate Action Items

1. **Short-term (This Week):**
   - ✅ Implement Option 2 (selective storage) - COMPLETED
   - Add cleanup management command for snapshots older than 90 days

2. **Medium-term (Next Sprint):**
   - Migrate to Option 1 (file storage model)
   - Set up S3/cloud storage bucket
   - Update frontend to display snapshots from file URLs

3. **Long-term (Next Quarter):**
   - Implement intelligent sampling (store every Nth snapshot + all violations)
   - Add admin dashboard for snapshot management
   - Set up automated archival to cold storage

## Migration Strategy

If moving from JSON to file storage:

1. Create new `ProctoringSnapshot` model
2. Write migration script to extract base64 from JSON and save as files
3. Update `upload_snapshot` view to use new model
4. Keep old JSON field for backward compatibility during transition
5. Remove JSON field after migration complete

## Cost Comparison

**Current (JSON in DB):**
- 480 GB/month in PostgreSQL = ~$50-100/month (depending on provider)
- Plus backup costs

**With File Storage (S3):**
- 480 GB/month in S3 = ~$10-15/month
- Plus database only stores metadata (~1% of current size)
- **Savings: ~85-90%**

