import { PrismaAffiliateRepository } from "@/modules/affiliates/infrastructure/PrismaAffiliateRepository"
import { ListUnseenByUserUseCase } from "@/modules/affiliates/application/listUnseenByUser"
import { MarkAsSeenUseCase } from "@/modules/affiliates/application/markAsSeen"
import { AssignAffiliatesToUserUseCase } from "@/modules/affiliates/application/assignAffiliatesToUser"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"
import { CreateUserUseCase } from "@/modules/users/application/createUser"
import { AuthenticateUserUseCase } from "@/modules/users/application/authenticateUser"

// Repositories
const affiliateRepo = new PrismaAffiliateRepository()
const userRepo = new PrismaUserRepository()

// Use cases
export const listUnseenByUser = new ListUnseenByUserUseCase(affiliateRepo)
export const markAsSeen = new MarkAsSeenUseCase(affiliateRepo)
export const assignAffiliatesToUser = new AssignAffiliatesToUserUseCase(affiliateRepo)
export const createUser = new CreateUserUseCase(userRepo)
export const authenticateUser = new AuthenticateUserUseCase(userRepo)
