import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatComponent } from './components/chat/chat.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ApolloLink, InMemoryCache } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

const errorLink = onError(({ graphQLErrors, networkError, response }) => {
  // React only on graphql errors
  if (graphQLErrors && graphQLErrors.length > 0) {
    if (
      (graphQLErrors[0] as any)?.statusCode >= 400 &&
      (graphQLErrors[0] as any)?.statusCode < 500
    ) {
      // handle client side error
      console.error(`[Client side error]: ${graphQLErrors[0].message}`);
    } else {
      // handle server side error
      console.error(`[Server side error]: ${graphQLErrors[0].message}`);
    }
  }
  if (networkError) {
    // handle network error
    console.error(`[Network error]: ${networkError.message}`);
  }
});

const basicContext = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      Accept: 'charset=utf-8',
      authorization: `Bearer random token`,
      'Content-Type': 'application/json',
    },
  };
});

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ApolloModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory(httpLink: HttpLink) {
        return {
          cache: new InMemoryCache(),
          link: ApolloLink.from([basicContext, errorLink, httpLink.create({
            uri: 'https://angular-test-backend-yc4c5cvnnq-an.a.run.app/graphql',
          })]),
          defaultOptions: {
            watchQuery: {
              errorPolicy: 'all',
            },
            mutate: {
              errorPolicy: 'all',
            },
          },
        };
      },
      deps: [HttpLink],
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
