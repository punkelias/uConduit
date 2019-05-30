import { Answer } from './answer';

export class Question {
    id: number;
    poll_id: number;
    text: string;
    type: string;
    answers: Answer[];
    feedback: any;
    answered: boolean;
    feedbackValue: number;
}
