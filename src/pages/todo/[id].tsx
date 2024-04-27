import React from "react";
import { GetServerSideProps } from "next";
import { CreateTodoInput, CreateTodoMutation, DeleteTodoInput, Todo } from "@/API";
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

export default function ToDoPage({todo}: {todo: Todo[]}) {
    const router = useRouter();

    if(router.isFallback) {
        return <div>Loading...</div>
    }

    async function handleDelete(): Promise<void> {
        try {
            const deleteinput: DeleteTodoInput = {
                id: todo.id,
            };

            await API.graphql({
                authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
                query: deleteTodo,
                variables: {
                    input: deleteinput,
                },
            });

            router.push('/todos');

        } catch (error) {
            console.error('Error deleting todo', error);
        }
    }

    return (
        <div>
            <h1>{todo.name}</h1>
            <link rel="icon" href="/public/next.svg"></link>
        <main>
            <h1>{todo.name}</h1>
            <p>{todo.description}</p>
        </main>
        <button onSubmit={handleDelete}>Delete</button>
        </div>
    
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    const SSR = withSSRContext();

    const todosQuery = (await SSR.API.graphql({
        query: listTodos,
        authMode: GRAPHQL_AUTH_MODE.API_KEY,
    }))
    as { 
        data: ListTodosQuery; 
        errors: any[]
    }

    const paths = todosQuery.data.listTodos.items.map((todo: Todo) => ({
    params: { id: todo.id },
    }))
    return { paths, fallback: true }
}

get const getStaticProps: GetStaticProps = async ({ params }) => {
    const SSR = withSSRContext();

    const response = (await SSR.API.graphql({
        query: getTodo,
        variables: {
            id: params.id,
        },
    })) as { data: GetTodoQuery }

    return {
        props: {
            todo: response.data.getTodo,
        },
    }
}
