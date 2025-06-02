import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { PageSection } from '../components/ui/page-section';
import { Checkbox } from '../components/ui/checkbox';
import { Dropdown, type DropdownOption } from '../components/ui/dropdown';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { ProgressBar } from '../components/ui/progress-bar';
import { Toggle } from '../components/ui/toggle';
import { ToastContainer, type ToastData } from '../components/ui/toast';
import { 
  Heart, 
  Send, 
  Settings, 
  Bell, 
  User,
  Mail,
  Calendar,
  Clock,
  Check,
  ToggleLeft,
  ChevronDown,
  LineChart,
  FileText,
  Save
} from 'lucide-react';

const TestUI: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dropdownOptions: DropdownOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const addToast = () => {
    const newToast: ToastData = {
      id: Date.now().toString(),
      label: 'Notification de test',
      icon: 'Bell',
      color: '#3b82f6',
    };
    setToasts(prev => [...prev, newToast]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <PageSection
        title="Catalogue des Composants UI"
        description="Une démonstration complète de notre bibliothèque de composants"
        className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section Boutons */}
        <PageSection
          subtitle={
            <div className="flex items-center gap-2">
              <Send size={24} className="text-blue-500" />
              Boutons
            </div>
          }
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">Tailles</h3>
            <div className="flex gap-4">
              <Button size="sm" label="Petit" color="#3b82f6" />
              <Button size="md" label="Moyen" color="#3b82f6" />
              <Button size="lg" label="Grand" color="#3b82f6" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">Avec Icônes</h3>
            <div className="flex gap-4">
              <Button label="J'aime" icon="Heart" color="#ef4444" />
              <Button label="Envoyer" icon="Send" color="#22c55e" />
              <Button label="Paramètres" icon="Settings" color="#6366f1" />
            </div>
          </div>
        </PageSection>

        {/* Section Cases à cocher */}
        <PageSection
          subtitle={
            <div className="flex items-center gap-2">
              <Check size={24} className="text-blue-500" />
              Cases à cocher
            </div>
          }
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">Tailles et États</h3>
            <div className="flex gap-8">
              <Checkbox 
                size="sm" 
                label="Petit" 
                checked={isChecked}
                onChange={setIsChecked}
              />
              <Checkbox 
                size="md" 
                label="Moyen" 
                color="#3b82f6"
                checked={isChecked}
                onChange={setIsChecked}
              />
              <Checkbox 
                size="lg" 
                label="Grand" 
                color="#6366f1"
                checked={isChecked}
                onChange={setIsChecked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">États spéciaux</h3>
            <div className="flex gap-8">
              <Checkbox label="Désactivé" disabled />
              <Checkbox label="Coché désactivé" checked disabled />
            </div>
          </div>
        </PageSection>

        {/* Section Toggles */}
        <PageSection
          subtitle={
            <div className="flex items-center gap-2">
              <ToggleLeft size={24} className="text-blue-500" />
              Toggles
            </div>
          }
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">Basique et avec icône</h3>
            <div className="flex gap-8">
              <Toggle 
                label="Toggle simple"
                checked={isToggled}
                onChange={setIsToggled}
              />
              <Toggle 
                label="Avec icône"
                icon="Bell"
                color="#3b82f6"
                checked={isToggled}
                onChange={setIsToggled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">États spéciaux</h3>
            <div className="flex gap-8">
              <Toggle label="Désactivé" disabled />
              <Toggle label="Activé désactivé" checked disabled />
            </div>
          </div>
        </PageSection>

        {/* Section Dropdown */}
        <PageSection
          subtitle={
            <div className="flex items-center gap-2">
              <ChevronDown size={24} className="text-blue-500" />
              Menu déroulant
            </div>
          }
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">Tailles</h3>
            <div className="flex gap-8">
              <Dropdown
                size="sm"
                options={dropdownOptions}
                value={selectedValue}
                onChange={setSelectedValue}
                label="Petit"
              />
              <Dropdown
                size="md"
                options={dropdownOptions}
                value={selectedValue}
                onChange={setSelectedValue}
                label="Moyen"
                color="#3b82f6"
              />
              <Dropdown
                size="lg"
                options={dropdownOptions}
                value={selectedValue}
                onChange={setSelectedValue}
                label="Grand"
                color="#6366f1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">Avec icônes</h3>
            <div className="flex gap-8">
              <Dropdown
                options={dropdownOptions}
                value={selectedValue}
                onChange={setSelectedValue}
                icon="User"
                label="Utilisateur"
              />
              <Dropdown
                options={dropdownOptions}
                value={selectedValue}
                onChange={setSelectedValue}
                icon="Settings"
                label="Paramètres"
                color="#3b82f6"
              />
            </div>
          </div>
        </PageSection>

        {/* Section Barres de progression */}
        <PageSection
          subtitle={
            <div className="flex items-center gap-2">
              <LineChart size={24} className="text-blue-500" />
              Barres de progression
            </div>
          }
        >
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Tailles</h3>
            <ProgressBar size="sm" percent={30} />
            <ProgressBar size="md" percent={50} color="#3b82f6" />
            <ProgressBar size="lg" percent={70} color="#6366f1" />
          </div>
        </PageSection>

        {/* Section Notifications */}
        <PageSection
          subtitle={
            <div className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Notifications
            </div>
          }
        >
          <div className="space-y-4">
            <Button 
              label="Afficher une notification" 
              icon="Bell" 
              color="#3b82f6"
              onClick={addToast}
            />
            <ToastContainer toasts={toasts} onClose={closeToast} />
          </div>
        </PageSection>
      </div>

      {/* Section Formulaire (pleine largeur) */}
      <PageSection
        subtitle={
          <div className="flex items-center gap-2">
            <FileText size={24} className="text-blue-500" />
            Formulaire
          </div>
        }
        className="mt-8"
      >
        <div className="bg-gray-50 p-6 rounded-lg">
          <Form size={100} columns={2}>
            <FormField
              label="Nom"
              required
              description="Votre nom complet"
            >
              <FormInput placeholder="John Doe" />
            </FormField>

            <FormField
              label="Email"
              required
              error="L'email est invalide"
            >
              <FormInput type="email" placeholder="john@example.com" />
            </FormField>

            <FormField label="Date de naissance">
              <FormInput type="date" />
            </FormField>

            <FormField label="Téléphone">
              <FormInput type="tel" placeholder="+33 6 12 34 56 78" />
            </FormField>

            <FormActions>
              <Button label="Annuler" color="#6b7280" />
              <Button label="Enregistrer" color="#3b82f6" icon="Save" />
            </FormActions>
          </Form>
        </div>
      </PageSection>
    </div>
  );
};

export default TestUI;