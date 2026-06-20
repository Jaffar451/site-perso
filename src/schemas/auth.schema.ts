// PATH: src/schemas/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  // On ajoute .optional() ou on autorise une chaîne vide pour ne plus bloquer
  firstname: z.string().min(2, "Prénom trop court").optional().or(z.literal("")),
  lastname: z.string().min(2, "Nom trop court").optional().or(z.literal("")),
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Mot de passe trop court (min 8 caractères)")
    .regex(/[A-Z]/, "Au moins une majuscule requise")
    .regex(/[a-z]/, "Au moins une minuscule requise")
    .regex(/[0-9]/, "Au moins un chiffre requis"),
  telephone: z.string().optional(), // Optionnel aussi au cas où
});

export const loginSchema = z.object({
  // Accepte matricule ou email
  identifier: z.string().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});