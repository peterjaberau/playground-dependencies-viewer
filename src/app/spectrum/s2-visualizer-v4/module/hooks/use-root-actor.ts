import { RootContext } from "../providers/root-provider"

export function useRootActor() {
  return RootContext.useActorRef()
}
