import { Json } from "./supabasetype";

export type RoomData = {
    id?: number;
    title: string;
    description: string,
    owner: string,
    password: string,
    hidden: boolean,
    options: RoomOption,
    special_keys: Json,
    variables: Json
}

export type RoomOption = {
    private: boolean;
    auto_all_clear: boolean,
    use_trump: boolean;
    user_limit: number;
    all_clear: string;
    variables: Json
}
