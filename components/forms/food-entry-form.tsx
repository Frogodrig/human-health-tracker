"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateNutriGrade } from "@/lib/utils/utils";
import type { ManualEntryForm } from "@/types";
import { Calculator, Info, Plus } from "lucide-react";

// Form schema
const foodEntrySchema = z.object({
  name: z.string().min(2, "Food name must be at least 2 characters"),
  brand: z.string().optional(),
  servingSize: z.number().min(0.1, "Serving size must be greater than 0"),
  servingUnit: z.string().min(1, "Please select a unit"),
  calories: z.number().min(0, "Calories cannot be negative"),
  protein: z.number().min(0, "Protein cannot be negative"),
  carbohydrates: z.number().min(0, "Carbohydrates cannot be negative"),
  fat: z.number().min(0, "Fat cannot be negative"),
  fiber: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  sugars: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  quantity: z.number().min(0.1, "Quantity must be greater than 0"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  notes: z.string().optional(),
});

type FoodEntryFormData = z.infer<typeof foodEntrySchema>;

interface FoodEntryFormProps {
  onSubmit: (data: ManualEntryForm) => Promise<void>;
  initialData?: Partial<FoodEntryFormData>;
  loading?: boolean;
  submitLabel?: string;
}

export function FoodEntryForm({
  onSubmit,
  initialData,
  loading = false,
  submitLabel = "Add Food",
}: FoodEntryFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<FoodEntryFormData>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      name: "",
      brand: "",
      servingSize: 100,
      servingUnit: "g",
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
      sugars: 0,
      saturatedFat: 0,
      quantity: 1,
      mealType: "SNACK",
      notes: "",
      ...initialData,
    },
  });

  const watchedValues = form.watch([
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "quantity",
    "servingSize",
    "sugars",
    "saturatedFat",
    "sodium",
  ]);

  // Calculate per serving nutrition
  const calculatePerServing = () => {
    const factor = watchedValues[4] * (watchedValues[5] / 100);
    return {
      calories: Math.round(watchedValues[0] * factor),
      protein: Math.round(watchedValues[1] * factor * 10) / 10,
      carbohydrates: Math.round(watchedValues[2] * factor * 10) / 10,
      fat: Math.round(watchedValues[3] * factor * 10) / 10,
    };
  };

  const perServing = calculatePerServing();

  // Calculate Nutri-Grade
  const nutriGrade = calculateNutriGrade({
    calories: watchedValues[0],
    protein: watchedValues[1],
    carbohydrates: watchedValues[2],
    fat: watchedValues[3],
    sugars: watchedValues[6],
    saturatedFat: watchedValues[7],
    sodium: watchedValues[8],
  });

  const handleSubmit = async (data: FoodEntryFormData) => {
    const formattedData: ManualEntryForm = {
      name: data.name,
      brand: data.brand,
      servingSize: data.servingSize,
      servingUnit: data.servingUnit,
      calories: data.calories,
      protein: data.protein,
      carbohydrates: data.carbohydrates,
      fat: data.fat,
      quantity: data.quantity,
      mealType: data.mealType,
    };

    await onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Food Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chicken Breast" {...field} />
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
                    <FormLabel>Brand (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Organic Valley" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                      <SelectItem value="LUNCH">Lunch</SelectItem>
                      <SelectItem value="DINNER">Dinner</SelectItem>
                      <SelectItem value="SNACK">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Serving Information */}
        <Card>
          <CardHeader>
            <CardTitle>Serving Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="servingSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Size *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="g">grams (g)</SelectItem>
                        <SelectItem value="ml">milliliters (ml)</SelectItem>
                        <SelectItem value="oz">ounces (oz)</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
                        <SelectItem value="slice">slice</SelectItem>
                        <SelectItem value="tbsp">tablespoon</SelectItem>
                        <SelectItem value="tsp">teaspoon</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Number of servings</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              Nutrition per {watchedValues[5]}
              {form.getValues("servingUnit")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carbohydrates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbs (g) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Nutrition */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Nutrition
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="fiber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiber (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sugars"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sugars (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
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
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sodium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sodium (mg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this food..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Nutrition Summary */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Total Nutrition
              </div>
              <Badge
                variant={nutriGrade === "A" ? "default" : "secondary"}
                className={
                  nutriGrade === "A"
                    ? "bg-green-100 text-green-800"
                    : nutriGrade === "B"
                    ? "bg-yellow-100 text-yellow-800"
                    : nutriGrade === "C"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
                }
              >
                Nutri-Grade {nutriGrade}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {perServing.calories}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {perServing.protein}g
                </div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {perServing.carbohydrates}g
                </div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {perServing.fat}g
                </div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
            </div>

            <Alert className="mt-4 bg-green-100 border-green-300">
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will add {perServing.calories} calories to your{" "}
                {form.getValues("mealType").toLowerCase()}.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            "Adding..."
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
