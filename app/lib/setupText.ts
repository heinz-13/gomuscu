import { Text, TextInput } from "react-native";

// Poppins par défaut sur tout le texte de l'app (le brief demande "Poppins partout").
// Les styles qui précisent déjà fontFamily/fontWeight (titres, boutons...) le remplacent
// normalement puisque leur style est fusionné après ce défaut.
const DEFAULT_FONT = { fontFamily: "Poppins_400Regular" };

// @ts-expect-error defaultProps existe à l'exécution même s'il n'est plus dans les types RN récents
Text.defaultProps = Text.defaultProps || {};
// @ts-expect-error idem
Text.defaultProps.style = [DEFAULT_FONT, Text.defaultProps.style];

// @ts-expect-error idem
TextInput.defaultProps = TextInput.defaultProps || {};
// @ts-expect-error idem
TextInput.defaultProps.style = [DEFAULT_FONT, TextInput.defaultProps.style];
