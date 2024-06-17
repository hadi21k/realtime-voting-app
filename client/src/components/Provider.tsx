"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const client = new QueryClient();

type Props = {
  children: React.ReactNode;
};

const Provider = ({ children }: Props) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default Provider;
