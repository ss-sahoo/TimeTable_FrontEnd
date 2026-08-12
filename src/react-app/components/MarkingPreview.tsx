import React from 'react';
import { 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X,
  Minus,
  Plus
} from 'lucide-react';
import { MarkingScheme } from '../../shared/types';

interface MarkingPreviewProps {
  questionType: 'Single Correct MCQ' | 'Multiple Correct MCQ' | 'Numerical' | 'Subjective' | 'True/False' | 'Fill in the Blanks';
  markingScheme: MarkingScheme;
  className?: string;
}

export default function MarkingPreview({ 
  questionType, 
  markingScheme, 
  className = '' 
}: MarkingPreviewProps) {
  
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'Single Correct MCQ':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'Multiple Correct MCQ':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Numerical':
        return <Calculator className="w-4 h-4 text-purple-600" />;
      case 'Subjective':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'True/False':
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      case 'Fill in the Blanks':
        return <AlertCircle className="w-4 h-4 text-pink-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMarkingExplanation = (type: string, scheme: MarkingScheme) => {
    switch (type) {
      case 'Single Correct MCQ':
        return [
          { condition: 'If correct option is marked', marks: `+${scheme.max_marks}`, color: 'text-green-600' },
          { condition: 'If no option is marked', marks: '0', color: 'text-gray-600' },
          { condition: 'In Any other case (-ve marking)', marks: `-${(scheme.max_marks * scheme.negative_marking_percentage / 100).toFixed(1)}`, color: 'text-red-600' }
        ];
      
      case 'Multiple Correct MCQ':
        if (scheme.partial_marking) {
          return [
            { condition: 'Each correct option', marks: `+${scheme.marks_per_correct_option ?? 1}` , color: 'text-green-600' },
            { condition: 'Each incorrect option', marks: '-1', color: 'text-red-600' },
            { condition: 'No options selected', marks: '0', color: 'text-gray-600' }
          ];
        } else {
          return [
            { condition: 'All correct, no incorrect', marks: `+${scheme.max_marks}`, color: 'text-green-600' },
            { condition: 'Any incorrect selected', marks: `-${(scheme.max_marks * scheme.negative_marking_percentage / 100).toFixed(1)}`, color: 'text-red-600' },
            { condition: 'No options selected', marks: '0', color: 'text-gray-600' }
          ];
        }
      
      case 'Numerical':
        return [
          { condition: `Correct value (±${scheme.tolerance_range || 0})`, marks: `+${scheme.max_marks}`, color: 'text-green-600' },
          { condition: 'Unattempted', marks: '0', color: 'text-gray-600' },
          { condition: 'Wrong value', marks: `-${(scheme.max_marks * scheme.negative_marking_percentage / 100).toFixed(1)}`, color: 'text-red-600' }
        ];
      
      case 'Subjective':
        return [
          { condition: 'Any attempt submitted', marks: `+${scheme.max_marks}`, color: 'text-green-600' },
          { condition: 'No attempt', marks: '0', color: 'text-gray-600' }
        ];
      
      case 'True/False':
        return [
          { condition: 'Correct answer', marks: `+${scheme.max_marks}`, color: 'text-green-600' },
          { condition: 'No answer', marks: '0', color: 'text-gray-600' },
          { condition: 'Wrong answer', marks: `-${(scheme.max_marks * scheme.negative_marking_percentage / 100).toFixed(1)}`, color: 'text-red-600' }
        ];
      
      case 'Fill in the Blanks':
        return [
          { condition: 'Correct answer', marks: `+${scheme.max_marks}`, color: 'text-green-600' },
          { condition: 'No answer', marks: '0', color: 'text-gray-600' },
          { condition: 'Wrong answer', marks: `-${(scheme.max_marks * scheme.negative_marking_percentage / 100).toFixed(1)}`, color: 'text-red-600' }
        ];
      
      default:
        return [];
    }
  };

  const explanations = getMarkingExplanation(questionType, markingScheme);

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {getQuestionTypeIcon(questionType)}
        <h4 className="text-sm font-semibold text-blue-800">Marking Scheme - {questionType}</h4>
      </div>
      
      <div className="space-y-2">
        {explanations.map((explanation, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {explanation.marks.startsWith('+') ? (
                <Plus className="w-3 h-3 text-green-600" />
              ) : explanation.marks.startsWith('-') ? (
                <Minus className="w-3 h-3 text-red-600" />
              ) : (
                <X className="w-3 h-3 text-gray-600" />
              )}
              <span className="text-blue-700">{explanation.condition}</span>
            </div>
            <span className={`font-medium ${explanation.color}`}>
              {explanation.marks}
            </span>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      {questionType === 'Numerical' && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Info className="w-3 h-3" />
            <span>
              Decimal precision: {markingScheme.decimal_precision || 2} places
            </span>
          </div>
        </div>
      )}

      {questionType === 'Subjective' && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Info className="w-3 h-3" />
            <span>
              Manual grading will be done after exam completion
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
