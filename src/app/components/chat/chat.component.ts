import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Chanels } from 'src/app/enums/chanels';
import { MessageInterface } from 'src/app/interfaces/message';
import { UserInterface } from 'src/app/interfaces/user';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  channels = Chanels;
  selectedChannel: string = Chanels.General;
  selectedUser: UserInterface | undefined = { id: 1, name: "Joyse", image: '../../../assets/images/Joyse.png' };
  messages: MessageInterface[] = [];

  users: UserInterface[] = [
    { id: 1, name: "Joyse", image: '../../../assets/images/Joyse.png' },
    { id: 2, name: "Sam", image: '../../../assets/images/Sam.png' },
    { id: 3, name: "Russell", image: '../../../assets/images/Russell.png' },
  ];

  constructor(private apollo: Apollo) { }

  ngOnInit() {
    this.fetchMessages();
  }

  async onChangeChannel(channel: string) {
    this.selectedChannel = channel;
    this.fetchMessages();
  }

  async onChangeUser(event: any) {
    this.selectedUser = this.users.find(user => user.id == event.target.value);
    this.fetchMessages();
  }

  async fetchMessages() {
    this.messages = [];
    this.apollo
      .watchQuery({
        query: gql`
        {
          MessagesFetchLatest(channelId: ${this.selectedChannel}){
            messageId,text,userId,datetime
         }
        }
      `,
      })
      .valueChanges.subscribe((result: any) => {
        this.messages = result.data.MessagesFetchLatest.slice(0);
        this.processMessages();
      });
  }

  processMessages() {
    this.messages = (this.messages).sort(function (a, b) {
      return ((new Date(a.datetime)).getTime() - (new Date(b.datetime)).getTime());
    });

    this.messages = this.messages.map(message => {
      let user = this.users.find(user => user.name == message.userId);
      let time = new Date(message.datetime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      message = {
        ...message,
        user: user,
        time: time
      };
      return message;
    })
    console.log(this.messages);
  }

}
