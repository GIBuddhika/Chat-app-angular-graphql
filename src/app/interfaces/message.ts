import { UserInterface } from "./user"

export interface MessageInterface {
    messageId: string,
    text: string
    userId: string,
    datetime: string,
    user: UserInterface|undefined,
    time: string
}
