import { PlayerMission } from './playerMission';

export class User {
    birthdate: string;
    email: string;
    first_name: string;
    gender: string;
    id: number;
    last_name: string;
    points: number;
    race: string;
    session_token: string;
    icon_path: string;
    country_code: string;
    postal_code: string;
    missions: PlayerMission[];
    visitorLevel: number;
    bankerLevel: number;
    sharerLevel: number;
    completerLevel: number;
}
