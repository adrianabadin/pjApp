import type { UserRepository } from "../domain/UserRepository"

const VALID_ROLES = ["admin", "operator"] as const

export class UpdateUserRoleUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(userId: string, role: string): Promise<void> {
    if (!(VALID_ROLES as readonly string[]).includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(", ")}`)
    }
    await this.repo.updateRole(userId, role)
  }
}
