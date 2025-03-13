export interface RadioOption {
    value: string;
    label: string;
    inputId: string;
}

export interface QuestionData {
    question: string;
    inputElm: string;
    elementId: string;
    options?: RadioOption[];
}
