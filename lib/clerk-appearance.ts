// Tokens de docs/03-design-system.md. Clerk viene con radius y sombras suaves
// por default; los anulamos para que las pantallas de auth no rompan la
// estetica "operational brief" del resto de la app.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#D63B32",
    colorBackground: "#1A1815",
    colorText: "#EFEAD8",
    colorTextSecondary: "#8B8474",
    colorInputBackground: "#23201C",
    colorInputText: "#EFEAD8",
    colorDanger: "#D63B32",
    colorSuccess: "#4A9E97",
    colorWarning: "#E5A03A",
    borderRadius: "2px",
    fontFamily: "var(--font-body)",
  },
  elements: {
    card: "border border-[#3A3730] shadow-none rounded-none",
    headerTitle: "font-[family-name:var(--font-display)] tracking-[-0.02em]",
    formButtonPrimary: "rounded-[2px] shadow-none normal-case tracking-[0.02em]",
    footerActionLink: "text-[#D63B32] hover:text-[#8A2723]",
  },
};
