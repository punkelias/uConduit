import { Question } from './question';

export class Poll {
    cover_path: string;
    expires_at: string;
    id: number;
    max_capacity: number;
    name: string;
    points: number;
    questions: Question[];
    show_crow_answers: number;
    created_at: string;
    cover: string;
    color: string;
    color_class: string;
}
