---
name: react-component-scaffold
description: Scaffolds new React components with TypeScript, Tailwind CSS, and shadcn/ui following consistent patterns. Use when creating new pages, components, forms, modals, tables, or any React UI element. Also triggers on requests to generate boilerplate, create CRUD interfaces, or build form components with validation.
---

# React Component Scaffold

Generates React components following a consistent, production-ready pattern with TypeScript, Tailwind CSS, shadcn/ui, react-hook-form, and Zod validation.

## Component Patterns

### 1. Page Component

```typescript
// pages/{feature}/index.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FeaturePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["feature"],
    queryFn: async () => {
      const { data, error } = await supabase.from("table").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feature Title</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo
        </Button>
      </div>
      {/* Content */}
    </div>
  );
}
```

### 2. Form Component (with Zod)

```typescript
// components/{feature}/FeatureForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof formSchema>;

interface FeatureFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
}

export function FeatureForm({ defaultValues, onSubmit }: FeatureFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", ...defaultValues },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      toast.success("Salvo com sucesso!");
      form.reset();
    } catch (err) {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
```

### 3. Data Table Component

```typescript
// components/{feature}/FeatureTable.tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export function FeatureTable({ items }: { items: Item[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge variant={item.status === "active" ? "default" : "secondary"}>
                {item.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Instructions

1. **Identify component type**: Page, Form, Table, Modal, Card, or custom
2. **Apply the matching pattern** from above
3. **Customize**: Replace placeholder names, add specific fields and logic
4. **Validation**: All forms must use Zod schemas with pt-BR error messages
5. **Loading states**: Every data-fetching component needs loading and error states
6. **Accessibility**: Include proper labels, aria attributes, keyboard navigation

## Constraints

- All user-facing text in pt-BR
- Use `sonner` for toast notifications (not `react-hot-toast`)
- Use `lucide-react` for icons (not other icon libraries)
- Forms always use `react-hook-form` + `zod`
- Data fetching with `@tanstack/react-query`
- Mobile-first responsive design with Tailwind
