import { api } from "@/react-app/hooks/useApi";

export interface ExtractionV2StartResponse {
    job_id: string;
    service_job_id: string;
    status: string;
    message: string;
}

export interface ExtractionV2StatusResponse {
    job_id: string;
    status: string;
    service_status: string;
    result_summary: any;
}

export const startExtractionV2 = async (file: File, examId: string, patternId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("exam_id", examId);
    formData.append("pattern_id", patternId);

    const response = await api.post<ExtractionV2StartResponse>("/questions/extract-v2/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const checkExtractionStatusV2 = async (jobId: string) => {
    const response = await api.get<ExtractionV2StatusResponse>(`/questions/extract-v2/${jobId}/status/`);
    return response.data;
};
