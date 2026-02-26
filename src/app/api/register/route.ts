import { NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/di"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    const user = await createUser.execute({ email, password, name })

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno"
    const status = message.includes("already registered") ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
