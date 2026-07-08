import { MainLayout } from "@/components/layout/MainLayout";
import { useCreateOrganization } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle2, Building2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.string().min(1, "Selecciona el tipo de organización"),
  country: z.string().min(2, "El país es requerido"),
  city: z.string().optional(),
  website: z.string().url("Debe ser una URL válida (ej. https://ejemplo.com)").optional().or(z.literal("")),
  description: z.string().optional(),
  contactEmail: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
});

export default function RegisterOrganization() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const createOrg = useCreateOrganization();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      country: "",
      city: "",
      website: "",
      description: "",
      contactEmail: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createOrg.mutate({ data: values }, {
      onSuccess: () => {
        setIsSuccess(true);
        window.scrollTo(0, 0);
      },
      onError: () => {
        toast({ title: "Error", description: "Ocurrió un error al registrar la organización.", variant: "destructive" });
      }
    });
  }

  if (isSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
          <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Registro Exitoso</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Su solicitud de registro ha sido enviada con éxito y se encuentra en estado <strong className="text-yellow-600">Pendiente</strong>.
          </p>
          <div className="bg-muted/50 p-6 rounded-lg text-left">
            <p className="mb-4">El equipo de SEMBER revisará la información de la institución para validar su autenticidad.</p>
            <p>Una vez aprobada, podrá acceder al <strong>Panel Institucional</strong> para publicar oportunidades, recibir postulaciones y gestionar su perfil en el ecosistema.</p>
          </div>
          <Button className="mt-8" onClick={() => window.location.href = '/'}>
            Volver al inicio
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Registrar Organización</h1>
          <p className="text-muted-foreground text-lg">
            Únete a la red global de talento. Publica pasantías, empleos, becas y conecta con miles de profesionales.
          </p>
        </div>

        <div className="p-8 border rounded-xl bg-card shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Institución *</FormLabel>
                      <FormControl><Input placeholder="Ej. Universidad Nacional" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Organización *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ORGANIZATION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País *</FormLabel>
                      <FormControl><Input placeholder="Ej. México" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl><Input placeholder="Ej. Ciudad de México" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto Oficial</FormLabel>
                      <FormControl><Input placeholder="contacto@institucion.edu" type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la Organización</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve descripción de la misión, visión y actividades de la institución..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t">
                <Button type="submit" size="lg" className="w-full" disabled={createOrg.isPending}>
                  {createOrg.isPending ? "Enviando solicitud..." : "Enviar Solicitud de Registro"}
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </MainLayout>
  );
}
