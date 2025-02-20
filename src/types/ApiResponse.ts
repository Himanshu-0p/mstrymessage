import { Message } from '@/model/User';

export interface ApiResponse{
    success: boolean;
    message: string | Array<Message>;
    isAcceptingMessage? : boolean
}