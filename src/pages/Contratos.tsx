import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, Building, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const Contratos = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gestão de Contratos
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie contratos e processos de desocupação
              </p>
            </div>
            <Link to="/cadastrar-contrato">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Novo Contrato
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Termo de Chaves</CardTitle>
              <CardDescription>
                Recebimento de chaves do imóvel
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-lg">Devolutiva Inquilino</CardTitle>
              <CardDescription>
                Comunicação com o inquilino
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Building className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Devolutiva Proprietário</CardTitle>
              <CardDescription>
                Comunicação com o proprietário
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Briefcase className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Devolutiva Comercial</CardTitle>
              <CardDescription>
                Comunicação comercial interna
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contratos Recentes</CardTitle>
            <CardDescription>
              Lista dos contratos cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contrato cadastrado ainda</p>
              <p className="text-sm">Clique em "Novo Contrato" para começar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contratos;