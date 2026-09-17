import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useColibriConfig } from "@colibri/react";
import { useColibriMutation } from "@colibri/react/query/mutation";
import { colibriQueryKey } from "@colibri/react/query";
import { useBalance } from "@colibri/react/assets";
import { accountId, exampleAccount } from "../../setup/fixtures.ts";
import {
  Actions,
  Field,
  MutationState,
  Note,
  QueryState,
  Value,
} from "../../components/lesson.tsx";
import { formatAmount } from "../../components/amount.ts";

export default function Mutation() {
  const config = useColibriConfig();
  const queryClient = useQueryClient();
  const [input, setInput] = useState(exampleAccount);
  const address = accountId(input);
  const balance = useBalance({ kind: "xlm" }, address, { retry: false });

  // Friendbot is a Testnet-only application action, not a wallet signature.
  // useColibriMutation supplies pending/error state, serializes mutations in
  // this provider scope, and never automatically repeats a funding request.
  const funding = useColibriMutation(async (account: `G${string}`) => {
    const { initializeWithFriendbot } = await import("@colibri/core");
    await initializeWithFriendbot(config.network.friendbotUrl!, account, {
      rpcUrl: config.network.rpcUrl,
    });
    return { account, fundedOn: "Testnet" };
  }, {
    onSuccess: (_result, account) =>
      queryClient.invalidateQueries({
        queryKey: colibriQueryKey(config, "balance", {
          asset: { kind: "xlm" },
          address: account,
        }),
      }),
  });
  return (
    <>
      <Note>
        Fund a disposable Testnet account with Friendbot. It can reject an
        already-funded account or rate-limit requests. The action waits for RPC
        visibility before refreshing the exact balance query.
      </Note>
      <Field
        label="Testnet G-address"
        value={input}
        onChange={(event) => setInput(event.target.value.trim())}
      />
      <Actions>
        <button
          type="button"
          disabled={!address || funding.isPending}
          onClick={() => {
            if (address) funding.mutate(address);
          }}
        >
          Request Testnet funding
        </button>
      </Actions>
      <MutationState mutation={funding} />
      <QueryState query={balance}>
        {balance.data && (
          <Value label="XLM balance">
            {formatAmount(balance.data.raw, balance.data.decimals)}
          </Value>
        )}
      </QueryState>
    </>
  );
}
