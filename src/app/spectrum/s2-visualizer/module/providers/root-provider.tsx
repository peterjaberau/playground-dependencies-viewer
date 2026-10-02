"use client"

import { createActorContext } from "@xstate/react"
import type { ReactNode } from "react"
import { rootMachine, type RootMachineInput } from "../machines/root-machine"

export const RootContext = createActorContext(rootMachine)

export function RootProvider({ children, input = { theme: "light" } }: { children: ReactNode; input?: RootMachineInput }) {
  return <RootContext.Provider options={{ input }}>{children}</RootContext.Provider>
}
