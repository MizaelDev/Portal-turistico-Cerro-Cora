"use client";

import { useActionState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { loginAction } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <LockKeyhole className="mt-0.5 h-4 w-4" />
          {state.error}
        </div>
      ) : null}

      <Button type="submit" variant="warm" disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
