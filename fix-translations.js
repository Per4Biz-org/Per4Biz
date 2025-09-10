const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam ser corrigidos
const filesToFix = [
  'src/components/employes/FichePersonnel/tabs/OngletContrats.tsx',
  'src/components/employes/FichePersonnel/tabs/OngletAffectations.tsx',
  'src/components/ParametreFinances/ParamJoursFormModal.tsx',
  'src/components/ParametreFinances/SousCategorieFlux/SousCategorieFluxForm.tsx',
  'src/components/ParametreFinances/CategorieFlux/CategorieFluxForm.tsx',
  'src/components/ParametreFinances/NatureFlux/NatureFluxForm.tsx',
  'src/components/ParametreBanque/CompteBancaireForm.tsx'
];

function fixTranslations() {
  filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Verifica se já tem useTranslation
      if (!content.includes('useTranslation')) {
        // Adiciona import
        if (content.includes("import React")) {
          content = content.replace(
            "import React",
            "import React\nimport { useTranslation } from 'react-i18next';"
          );
        }
        
        // Adiciona hook na função (procura por export function ou const = () =>)
        const functionRegex = /(export\s+function\s+\w+\s*\([^}]*?\)\s*\{[^}]*?)(const\s+\{[^}]*?\}\s*=\s*[^;]*?;)/;
        if (functionRegex.test(content)) {
          content = content.replace(functionRegex, '$1const { t } = useTranslation();\n  $2');
        }
      }
      
      // Substitui o texto hardcoded
      content = content.replace(/"Sélectionner une entité"/g, "t('common.selectEntity')");
      
      // Escreve de volta
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`❌ File not found: ${filePath}`);
    }
  });
}

fixTranslations();
console.log('🎉 Translation fix completed!');