import { test, expect } from "@playwright/test"

// Credenciales de test via variable de entorno (no hardcodeadas en producción)
// Para correr E2E: E2E_EMAIL=admin@saladillo.gob.ar E2E_PASSWORD=password123 npm run test:e2e
const TEST_EMAIL = process.env.E2E_EMAIL ?? "admin@saladillo.gob.ar"
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "password123"

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Limpiamos cookies/storage antes de cada test para garantizar estado limpio
    await page.context().clearCookies()
  })

  test("muestra el formulario de login en /login", async ({ page }) => {
    // Arrange & Act
    await page.goto("/login")

    // Assert
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Contraseña")).toBeVisible()
    await expect(page.getByRole("button", { name: /ingresar/i })).toBeVisible()
  })

  test("redirige a /dashboard tras login exitoso con credenciales válidas", async ({ page }) => {
    // Arrange
    await page.goto("/login")

    // Act
    await page.getByLabel("Email").fill(TEST_EMAIL)
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).click()

    // Assert
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test("muestra error con credenciales inválidas y permanece en /login", async ({ page }) => {
    // Arrange
    await page.goto("/login")

    // Act
    await page.getByLabel("Email").fill("noexiste@example.com")
    await page.getByLabel("Contraseña").fill("wrongpassword")
    await page.getByRole("button", { name: /ingresar/i }).click()

    // Assert
    await expect(page.getByText(/credenciales inválidas/i)).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Dashboard Protegido", () => {
  test("redirige a /login al intentar acceder a /dashboard sin autenticación", async ({ page }) => {
    // Arrange: aseguramos que no hay sesión
    await page.context().clearCookies()

    // Act
    await page.goto("/dashboard")

    // Assert
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("muestra el dashboard tras autenticación válida", async ({ page }) => {
    // Arrange: login primero
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL)
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

    // Act: intentar ir a /dashboard directamente (ya autenticado)
    await page.goto("/dashboard")

    // Assert
    await expect(page).toHaveURL(/\/dashboard/)
    // Verifica que el header del dashboard se muestra
    await expect(page.getByText(/padrón de afiliados/i).first()).toBeVisible()
  })
})

test.describe("Register Page", () => {
  test("muestra el formulario de registro en /register con campos name, email y password", async ({ page }) => {
    // Arrange & Act
    await page.goto("/register")

    // Assert: los tres campos requeridos existen
    await expect(page.getByLabel("Nombre")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Contraseña")).toBeVisible()
    await expect(page.getByRole("button", { name: /crear cuenta/i })).toBeVisible()
  })

  test("el campo password en /register tiene atributo minLength=8", async ({ page }) => {
    // Arrange & Act
    await page.goto("/register")

    // Assert
    const passwordInput = page.getByLabel("Contraseña")
    await expect(passwordInput).toHaveAttribute("minlength", "8")
  })
})

test.describe("Ausencia de link /register en páginas públicas", () => {
  test("la página raíz / NO contiene links a /register", async ({ page }) => {
    // Arrange & Act
    await page.goto("/")

    // Assert: no hay links que apunten a /register
    const registerLinks = page.locator('a[href*="/register"]')
    await expect(registerLinks).toHaveCount(0)
  })

  test("la página /login NO contiene links a /register", async ({ page }) => {
    // Arrange & Act
    await page.goto("/login")

    // Assert
    const registerLinks = page.locator('a[href*="/register"]')
    await expect(registerLinks).toHaveCount(0)
  })
})
