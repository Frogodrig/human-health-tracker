import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const manualProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  brand: z.string().optional(),
  servingSize: z.number().min(0.1, "Serving size must be greater than 0"),
  servingUnit: z.string().min(1, "Please select a unit"),
  calories: z.number().min(0, "Calories cannot be negative"),
  protein: z.number().min(0, "Protein cannot be negative"),
  carbohydrates: z.number().min(0, "Carbohydrates cannot be negative"),
  fat: z.number().min(0, "Fat cannot be negative"),
  sugars: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  ingredients: z.string().optional(),
  categories: z.string().optional(),
  allergens: z.string().optional(),
  additives: z.string().optional(),
  ecoScore: z.number().min(0).max(100).optional(),
  ecoScoreGrade: z.string().optional(),
  novaGroup: z.number().min(1).max(4).optional(),
  labels: z.string().optional(),
  packaging: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  brandOwner: z.string().optional(),
  expirationDate: z.string().optional(),
  // File uploads
  imageFront: z.any().optional(),
  imageIngredients: z.any().optional(),
  imageNutrition: z.any().optional(),
});

type ManualProductFormData = z.infer<typeof manualProductSchema>;

export function ManualProductForm({
  onSubmit,
  loading = false,
}: {
  onSubmit: (data: ManualProductFormData) => Promise<void>;
  loading?: boolean;
}) {
  const form = useForm<ManualProductFormData>({
    resolver: zodResolver(manualProductSchema),
    defaultValues: {
      name: "",
      brand: "",
      servingSize: 100,
      servingUnit: "g",
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      sugars: 0,
      fiber: 0,
      sodium: 0,
      saturatedFat: 0,
      ingredients: "",
      categories: "",
      allergens: "",
      additives: "",
      ecoScore: undefined,
      ecoScoreGrade: "",
      novaGroup: undefined,
      labels: "",
      packaging: "",
      countryOfOrigin: "",
      brandOwner: "",
      expirationDate: "",
    },
  });

  const handleFileChange = (
    field: keyof ManualProductFormData,
    file: File | null
  ) => {
    form.setValue(field, file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Product Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Greek Yogurt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chobani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="servingSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Size *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Unit *</FormLabel>
                    <FormControl>
                      <Input placeholder="g, ml, piece..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="protein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="carbohydrates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbohydrates (g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fat (g) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sugars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sugars (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiber (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sodium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sodium (mg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saturatedFat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saturated Fat (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Milk, Bacterial Cultures"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dairy, Yogurt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allergens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergens</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Milk, Soy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additives</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., E202, E330" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ecoScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eco-Score</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ecoScoreGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eco-Score Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="A, B, C, D, E" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="novaGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NOVA Group</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min={1} max={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labels</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Organic, Gluten-Free"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="packaging"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Packaging</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Plastic, Paper" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryOfOrigin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country of Origin</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USA, France" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brandOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Chobani Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Image Uploads */}
            <div className="grid gap-4 md:grid-cols-3">
              <FormItem>
                <FormLabel>Front Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange("imageFront", e.target.files?.[0] || null)
                  }
                />
              </FormItem>
              <FormItem>
                <FormLabel>Ingredients Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      "imageIngredients",
                      e.target.files?.[0] || null
                    )
                  }
                />
              </FormItem>
              <FormItem>
                <FormLabel>Nutrition Label Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      "imageNutrition",
                      e.target.files?.[0] || null
                    )
                  }
                />
              </FormItem>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : "Submit Product"}
        </Button>
      </form>
    </Form>
  );
}
