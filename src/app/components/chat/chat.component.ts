import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Chanels } from 'src/app/enums/chanels';
import { MessageInterface } from 'src/app/interfaces/message';
import { UserInterface } from 'src/app/interfaces/user';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  channels = Chanels;
  isLoaing: boolean = true;
  selectedChannel: string = Chanels.General;
  selectedUser: UserInterface | undefined = { id: 1, name: "Joyse", image: '../../../assets/images/Joyse.png' };
  message: string = "";
  messages: MessageInterface[] = [];
  errMessage: string | null = null;
  unsentMessages: any = [];

  users: UserInterface[] = [
    { id: 1, name: "Joyse", image: '../../../assets/images/Joyse.png' },
    { id: 2, name: "Sam", image: '../../../assets/images/Sam.png' },
    { id: 3, name: "Russell", image: '../../../assets/images/Russell.png' },
  ];

  constructor(private apollo: Apollo) { }

  ngOnInit() {
    this.fetchMessages();
    this.setUnsentMessage();
  }

  setUnsentMessage() {
    let unsentMessages = localStorage.getItem("unsentMessages") || "";
    let unsentMessageObj = JSON.parse(unsentMessages).find((unsentMessage: any) => unsentMessage.user.id == this.selectedUser?.id && unsentMessage.channel == this.selectedChannel);
    if (unsentMessageObj) {
      this.message = unsentMessageObj.text;
    } else {
      this.message = "";
    }
  }

  async fetchMessages() {
    this.messages = [];
    this.apollo
      .watchQuery({
        query: gql`
        {
          MessagesFetchLatest(channelId: ${this.selectedChannel},){
            messageId,text,userId,datetime
         }
        }
      `,
      })
      .valueChanges.subscribe((result: any) => {
        this.messages = result.data.MessagesFetchLatest.slice(0);
        this.messages = (this.messages).sort(function (a, b) {
          return ((new Date(a.datetime)).getTime() - (new Date(b.datetime)).getTime());
        });

        this.processMessages();
        this.scrollToBottom();
        this.isLoaing = false;
      });
  }

  scrollToBottom() {
    const element = document.getElementById('box');
    setTimeout(() => {
      element?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }, 100);
  }

  processMessages() {
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
  }

  async onChangeChannel(channel: string) {
    this.selectedChannel = channel;
    this.setUnsentMessage();
    this.fetchMessages();
  }

  async onChangeUser(event: any) {
    this.selectedUser = this.users.find(user => user.id == event.target.value);
    this.setUnsentMessage();
    this.fetchMessages();
  }

  fetchOldMessages() {
    let newsetMessage = this.messages[0];
    this.fetchMoreMessages(newsetMessage.messageId, true);
  }

  fetchNewestMessages() {
    let newsetMessage = this.messages[this.messages.length - 1];
    this.fetchMoreMessages(newsetMessage.messageId, false);
  }

  fetchMoreMessages(messageId: string, isFetchOld: boolean) {
    this.isLoaing = true;
    this.apollo
      .watchQuery({
        query: gql`
        {
          fetchMoreMessages(
            channelId: "${this.selectedChannel}",
            messageId: "${messageId}",
            old: ${isFetchOld},
            ){
            messageId,text,userId,datetime
         }
        }
      `,
      })
      .valueChanges.subscribe((result: any) => {
        if (result.data.fetchMoreMessages.slice(0).length > 0) {
          this.messages = result.data.fetchMoreMessages.slice(0);
          this.messages = (this.messages).sort(function (a, b) {
            return ((new Date(a.datetime)).getTime() - (new Date(b.datetime)).getTime());
          });
          this.processMessages();
          if (!isFetchOld) {
            this.scrollToBottom();
          }
        } else {
          this.toastWarning(`No ${isFetchOld ? 'old' : 'new'} messages found`);
        }

        this.isLoaing = false;
      });
  }

  sendMessage() {
    this.errMessage = null;
    let userId = this.users.find(user => user.id == this.selectedUser?.id)?.name || "";
    this.apollo
      .mutate({
        mutation: gql`
        mutation MessagePost{
          postMessage(
            channelId: "${this.selectedChannel}",
            userId: "${userId}",
            text:"${this.message}",
           ) {    
            messageId,
            userId,
            text,
            datetime
        }
      }
    `,
      }).subscribe(({ data, loading, errors }) => {
        this.unsentMessages = JSON.parse(localStorage.getItem("unsentMessages") || "");
        if (errors) {
          if (errors[0].extensions['code'] == 500) {
            this.errMessage = "Couldn't save message, please retry.";
          } else if (errors[0].extensions['code'] == 400) {
            this.errMessage = "Channel not found";
          }
          this.unsentMessages.push({
            user: this.selectedUser,
            channel: this.selectedChannel,
            text: this.message
          });
        } else {
          this.unsentMessages = this.unsentMessages.filter((unsentMessage: any) => !(unsentMessage.user.id == this.selectedUser?.id && unsentMessage.channel == this.selectedChannel));
        }
        localStorage.setItem("unsentMessages", JSON.stringify(this.unsentMessages));

        let dateTime = new Date();

        this.messages.push({
          messageId: Math.random().toString(),
          text: this.message,
          userId: userId.toString(),
          datetime: (dateTime).toISOString(),
          user: this.selectedUser,
          time: new Date(dateTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          errMessage: this.errMessage
        });
        this.processMessages();
        if (!errors) {
          this.message = "";
        }
      });
  }

  toastWarning(message: string) {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      icon: "warning",
      timer: 3000,
      title: message
    })
  }
}
