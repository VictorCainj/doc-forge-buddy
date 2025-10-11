import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Plus, Trash2, User } from '@/utils/iconMapper';

interface Person {
  id: string;
  name: string;
}

interface PersonManagerProps {
  title: string;
  people: Person[];
  onPeopleChange: (people: Person[]) => void;
  placeholder?: string;
  maxPeople?: number;
}

export const PersonManager: React.FC<PersonManagerProps> = ({
  title,
  people,
  onPeopleChange,
  placeholder = 'Nome completo',
  maxPeople = 4,
}) => {
  const [newPersonName, setNewPersonName] = useState('');

  const addPerson = () => {
    if (newPersonName.trim() && people.length < maxPeople) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: newPersonName.trim(),
      };
      onPeopleChange([...people, newPerson]);
      setNewPersonName('');
    }
  };

  const removePerson = (id: string) => {
    onPeopleChange(people.filter((person) => person.id !== id));
  };

  const updatePerson = (id: string, name: string) => {
    onPeopleChange(
      people.map((person) => (person.id === id ? { ...person, name } : person))
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPerson();
    }
  };

  return (
    <Card className="person-manager-card border-neutral-200 shadow-elevation-1 rounded-xl">
      <CardHeader className="border-b border-neutral-200">
        <CardTitle className="flex items-center gap-2 card-title text-neutral-900 font-medium">
          <User className="h-5 w-5 text-primary-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Lista de pessoas adicionadas */}
        {people.map((person, index) => (
          <div
            key={person.id}
            className="person-item flex items-center gap-2 p-3 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-all"
          >
            <div className="flex-1">
              <Label
                htmlFor={`person-${person.id}`}
                className="text-sm font-medium text-neutral-700"
              >
                {title} {index + 1}:
              </Label>
              <Input
                id={`person-${person.id}`}
                value={person.name}
                onChange={(e) => updatePerson(person.id, e.target.value)}
                placeholder={placeholder}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removePerson(person.id)}
              className="text-error-600 hover:text-error-700 hover:bg-error-50 hover:border-error-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Campo para adicionar nova pessoa */}
        {people.length < maxPeople && (
          <div className="person-add flex items-end gap-2 p-3 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 hover:border-primary-300 transition-all">
            <div className="flex-1">
              <Label
                htmlFor="new-person"
                className="text-sm font-medium text-neutral-700"
              >
                Adicionar {title}:
              </Label>
              <Input
                id="new-person"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              onClick={addPerson}
              disabled={!newPersonName.trim()}
              size="sm"
              className="bg-primary-500 hover:bg-primary-600 shadow-elevation-1 hover:shadow-elevation-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {people.length >= maxPeople && (
          <p className="text-sm text-neutral-600 text-center">
            Máximo de {maxPeople} {title.toLowerCase()} atingido
          </p>
        )}
      </CardContent>
    </Card>
  );
};
