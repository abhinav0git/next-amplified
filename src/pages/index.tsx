import React from "react";
import { GetServerSideProps } from "next";
import { CreateTodoInput, CreateTodoMutation, Todo } from "@/API";
import { createTodo } from "@/graphql/mutations";
import { listTodos } from "@/graphql/queries";
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api';
import { API } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { withSSRContext } from 'aws-amplify';
import Amplify  from "aws-amplify";
import awsExports from '@/aws-exports';
import { useRouter } from "next/router";

Amplify.configure({ ...awsExports, ssr: true });


export default function Home({todos = []}: {todos: Todo[]}) {
  const router = useRouter();

  async function handleCreateTodo(event: { preventDefault: () => void; target: HTMLFormElement | undefined; }) {
    event.preventDefault();
    const form = new FormData(event.target);

    try {
      const createInput: CreateTodoInput = {
        name: form.get("title")?.toString() || "",
        description: form.get("content")?.toString() || "",
      }

      const response = (await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: createTodo,
        variables: {
          input: createInput,
        },
      })) as { data: CreateTodoMutation; errors: any[] }

      router.push(`/todo/${response.data.createTodo.id}`);
      }
    catch ( error ) {
      console.error('Error creating todo', error);
    }
  }

  return (
      <div className="container">
      <div className="grid">
        {todos.map((todo) => (
            <a href={'/todo/${todo.id}'} key={todo.id}>
              <h3>{todo.name}</h3>
              <p>{todo.description}</p>
            </a>
          ))}
      </div>

        <Authenticator>
        <form onSubmit={handleCreateTodo}>
          <fieldset>
            <legend>Title</legend>
            <input defaultValue={`Today, ${new Date().toLocaleTimeString()}`} name="title" />
          </fieldset>

          <fieldset>
            <legend>Content</legend>
            <textarea defaultValue="Built an Amplify App with NextJs" name="content" />
          </fieldset>

          <button>Create ToDo</button>
        </form>    
        </Authenticator>
      </div>
      );
    }

export const getServerSideProps: GetServerSideProps = async ({req}) => {
  const SSR = withSSRcontext({req});

  const reponse = (await SSR.api.grapgql({query: listTodos})) as {
    data: {listTodos: {items: Todo[]}};
  }

  return {
    props: {
      toods: reponse.data.listTodos.items,
    },
  };
};

function withSSRcontext({ req }: { req: import("http").IncomingMessage & { cookies: Partial<{ [key: string]: string }> } }) {
  console.log("Incoming request:", req);
  console.log("Cookies:", req.cookies);
}
