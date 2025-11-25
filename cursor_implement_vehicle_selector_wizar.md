# Implement vehicle selector wizard component
_Exported on 11/20/2025 at 11:33:46 GMT+1 from Cursor (2.0.77)_

---

**User**

generate the UI for Task 2 according to the Project Rules:

Task 2 – VehicleSelector client component (wizard UI)
Title: Implement VehicleSelector wizard component using shadcn
Files involved:
components/vehicle-selector.tsx (new)
Description:
Create a client component that:
Renders a 3-step wizard:
Step 1: Brand (MG/BYD/Omoda) via shadcn Select/Combobox.
Step 2: Model dropdown filtered by selected brand.
Step 3: Engine/vehicle dropdown filtered by selected model.
Fetches data via lib/db.ts functions from Task 1.
Emits a callback or updates URL search params (brand, model, vehicleId) when selection is complete.
Use shadcn primitives (Button, Select, Label, optional Tabs or a simple step header).
Databases / queries:
Uses getChineseBrands, getModelsByBrand, getVehiclesByModel (client-side Supabase via our db helpers).

---

**Cursor**

```typescriptreact
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

```

```typescriptreact
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

```

```typescriptreact
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  getChineseBrands,
  getModelsByBrand,
  getVehiclesByModel,
} from "@/lib/db"
import type { Brand, Model, Vehicle } from "@/lib/types"

interface VehicleSelectorProps {
  className?: string
  onComplete?: (selection: {
    brandId: string
    modelId: string
    vehicleId: string
  }) => void
  mode?: "wizard" | "compact" // simple prop to toggle styles if needed, defaulting to wizard card style
}

export function VehicleSelector({
  className,
  onComplete,
  mode = "wizard",
}: VehicleSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for selections
  const [selectedBrand, setSelectedBrand] = React.useState<string>("")
  const [selectedModel, setSelectedModel] = React.useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("")

  // State for data
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])

  // State for loading
  const [loadingBrands, setLoadingBrands] = React.useState(false)
  const [loadingModels, setLoadingModels] = React.useState(false)
  const [loadingVehicles, setLoadingVehicles] = React.useState(false)

  // Fetch Brands on Mount
  React.useEffect(() => {
    async function fetchBrands() {
      setLoadingBrands(true)
      try {
        const data = await getChineseBrands()
        setBrands(data)
      } catch (error) {
        console.error("Failed to fetch brands", error)
      } finally {
        setLoadingBrands(false)
      }
    }
    fetchBrands()
  }, [])

  // Fetch Models when Brand changes
  React.useEffect(() => {
    if (!selectedBrand) {
      setModels([])
      return
    }
    async function fetchModels() {
      setLoadingModels(true)
      try {
        const data = await getModelsByBrand(selectedBrand)
        setModels(data)
      } catch (error) {
        console.error("Failed to fetch models", error)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [selectedBrand])

  // Fetch Vehicles when Model changes
  React.useEffect(() => {
    if (!selectedModel) {
      setVehicles([])
      return
    }
    async function fetchVehicles() {
      setLoadingVehicles(true)
      try {
        const data = await getVehiclesByModel(selectedModel)
        setVehicles(data)
      } catch (error) {
        console.error("Failed to fetch vehicles", error)
      } finally {
        setLoadingVehicles(false)
      }
    }
    fetchVehicles()
  }, [selectedModel])

  // Initialize from URL params if present
  React.useEffect(() => {
    const brandParam = searchParams.get("brand")
    const modelParam = searchParams.get("model")
    const vehicleParam = searchParams.get("vehicleId")

    if (brandParam && brandParam !== selectedBrand) {
        // Validation logic could go here to ensure the brand exists in the fetched list
        // For now we just set it if we have brands loaded or optimistic update
        setSelectedBrand(brandParam)
    }
    if (modelParam && modelParam !== selectedModel) {
        setSelectedModel(modelParam)
    }
    if (vehicleParam && vehicleParam !== selectedVehicle) {
        setSelectedVehicle(vehicleParam)
    }
  }, [searchParams]) // Intentionally only run on mount or param changes, but need to be careful about infinite loops if we update params.

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value)
    setSelectedModel("") // Reset model
    setSelectedVehicle("") // Reset vehicle
    setModels([])
    setVehicles([])
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    setSelectedVehicle("") // Reset vehicle
    setVehicles([])
  }

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value)
  }

  const handleSubmit = () => {
    if (!selectedBrand || !selectedModel || !selectedVehicle) return

    // 1. Emit callback if provided
    if (onComplete) {
      onComplete({
        brandId: selectedBrand,
        modelId: selectedModel,
        vehicleId: selectedVehicle,
      })
    }

    // 2. Update URL params
    const params = new URLSearchParams(searchParams.toString())
    params.set("brand", selectedBrand)
    params.set("model", selectedModel)
    params.set("vehicleId", selectedVehicle)
    
    // Navigate to products page with filter or just update current URL
    // If we are already on products page, this updates filters.
    // If we are on home page, maybe we want to go to products page?
    // For now, I'll assume we just push the params to the current route or a specific search route.
    // But typically a vehicle selector on home page sends you to a results page.
    // I'll check the current path.
    
    const isProductsPage = window.location.pathname.startsWith('/products') || window.location.pathname.startsWith('/oil-selector')
    
    if (!isProductsPage) {
        router.push(`/products?${params.toString()}`)
    } else {
        router.push(`?${params.toString()}`)
    }
  }

  const isSubmitDisabled = !selectedBrand || !selectedModel || !selectedVehicle

  return (
    <Card className={cn("w-full max-w-3xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>Find Parts for Your Vehicle</CardTitle>
        <CardDescription>
          Select your vehicle to see compatible parts and oils.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Step 1: Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand-select">Brand</Label>
            <Select
              value={selectedBrand}
              onValueChange={handleBrandChange}
              disabled={loadingBrands}
            >
              <SelectTrigger id="brand-select">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Brands</SelectLabel>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Model */}
          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <Select
              value={selectedModel}
              onValueChange={handleModelChange}
              disabled={!selectedBrand || loadingModels}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                   <SelectLabel>Models</SelectLabel>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} {model.year_start ? `(${model.year_start}-)` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Vehicle (Engine/Spec) */}
          <div className="space-y-2">
            <Label htmlFor="vehicle-select">Engine / Type</Label>
            <Select
              value={selectedVehicle}
              onValueChange={handleVehicleChange}
              disabled={!selectedModel || loadingVehicles}
            >
              <SelectTrigger id="vehicle-select">
                <SelectValue placeholder="Select Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                   <SelectLabel>Vehicles</SelectLabel>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.engine_type ? `${vehicle.engine_type} ` : ''}
                      {vehicle.displacement ? `${vehicle.displacement}L ` : ''}
                      {vehicle.power_kw ? `${vehicle.power_kw}kW` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled}
            className="w-full md:w-auto"
          >
            Find Compatible Parts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

```

```typescriptreact
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  getChineseBrands,
  getModelsByBrand,
  getVehiclesByModel,
} from "@/lib/db"
import type { Brand, Model, Vehicle } from "@/lib/types"

interface VehicleSelectorProps {
  className?: string
  onComplete?: (selection: {
    brandId: string
    modelId: string
    vehicleId: string
  }) => void
  mode?: "wizard" | "compact" // simple prop to toggle styles if needed, defaulting to wizard card style
}

export function VehicleSelector({
  className,
  onComplete,
  mode = "wizard",
}: VehicleSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for selections
  const [selectedBrand, setSelectedBrand] = React.useState<string>("")
  const [selectedModel, setSelectedModel] = React.useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("")

  // State for data
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])

  // State for loading
  const [loadingBrands, setLoadingBrands] = React.useState(false)
  const [loadingModels, setLoadingModels] = React.useState(false)
  const [loadingVehicles, setLoadingVehicles] = React.useState(false)

  // Fetch Brands on Mount
  React.useEffect(() => {
    async function fetchBrands() {
      setLoadingBrands(true)
      try {
        const data = await getChineseBrands()
        setBrands(data)
      } catch (error) {
        console.error("Failed to fetch brands", error)
      } finally {
        setLoadingBrands(false)
      }
    }
    fetchBrands()
  }, [])

  // Fetch Models when Brand changes
  React.useEffect(() => {
    if (!selectedBrand) {
      setModels([])
      return
    }
    async function fetchModels() {
      setLoadingModels(true)
      try {
        const data = await getModelsByBrand(selectedBrand)
        setModels(data)
      } catch (error) {
        console.error("Failed to fetch models", error)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [selectedBrand])

  // Fetch Vehicles when Model changes
  React.useEffect(() => {
    if (!selectedModel) {
      setVehicles([])
      return
    }
    async function fetchVehicles() {
      setLoadingVehicles(true)
      try {
        const data = await getVehiclesByModel(selectedModel)
        setVehicles(data)
      } catch (error) {
        console.error("Failed to fetch vehicles", error)
      } finally {
        setLoadingVehicles(false)
      }
    }
    fetchVehicles()
  }, [selectedModel])

  // Initialize from URL params if present
  React.useEffect(() => {
    const brandParam = searchParams.get("brand")
    const modelParam = searchParams.get("model")
    const vehicleParam = searchParams.get("vehicleId")

    if (brandParam && brandParam !== selectedBrand) {
        // Validation logic could go here to ensure the brand exists in the fetched list
        // For now we just set it if we have brands loaded or optimistic update
        setSelectedBrand(brandParam)
    }
    if (modelParam && modelParam !== selectedModel) {
        setSelectedModel(modelParam)
    }
    if (vehicleParam && vehicleParam !== selectedVehicle) {
        setSelectedVehicle(vehicleParam)
    }
  }, [searchParams]) // Intentionally only run on mount or param changes, but need to be careful about infinite loops if we update params.

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value)
    setSelectedModel("") // Reset model
    setSelectedVehicle("") // Reset vehicle
    setModels([])
    setVehicles([])
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    setSelectedVehicle("") // Reset vehicle
    setVehicles([])
  }

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value)
  }

  const handleSubmit = () => {
    if (!selectedBrand || !selectedModel || !selectedVehicle) return

    // 1. Emit callback if provided
    if (onComplete) {
      onComplete({
        brandId: selectedBrand,
        modelId: selectedModel,
        vehicleId: selectedVehicle,
      })
    }

    // 2. Update URL params
    const params = new URLSearchParams(searchParams.toString())
    params.set("brand", selectedBrand)
    params.set("model", selectedModel)
    params.set("vehicleId", selectedVehicle)
    
    // Navigate to products page with filter or just update current URL
    // If we are already on products page, this updates filters.
    // If we are on home page, maybe we want to go to products page?
    // For now, I'll assume we just push the params to the current route or a specific search route.
    // But typically a vehicle selector on home page sends you to a results page.
    // I'll check the current path.
    
    const isProductsPage = window.location.pathname.startsWith('/products') || window.location.pathname.startsWith('/oil-selector')
    
    if (!isProductsPage) {
        router.push(`/products?${params.toString()}`)
    } else {
        router.push(`?${params.toString()}`)
    }
  }

  const isSubmitDisabled = !selectedBrand || !selectedModel || !selectedVehicle

  return (
    <Card className={cn("w-full max-w-3xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>Find Parts for Your Vehicle</CardTitle>
        <CardDescription>
          Select your vehicle to see compatible parts and oils.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Step 1: Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand-select">Brand</Label>
            <Select
              value={selectedBrand}
              onValueChange={handleBrandChange}
              disabled={loadingBrands}
            >
              <SelectTrigger id="brand-select">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Brands</SelectLabel>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Model */}
          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <Select
              value={selectedModel}
              onValueChange={handleModelChange}
              disabled={!selectedBrand || loadingModels}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                   <SelectLabel>Models</SelectLabel>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} {model.year_start ? `(${model.year_start}-)` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Vehicle (Engine/Spec) */}
          <div className="space-y-2">
            <Label htmlFor="vehicle-select">Engine / Type</Label>
            <Select
              value={selectedVehicle}
              onValueChange={handleVehicleChange}
              disabled={!selectedModel || loadingVehicles}
            >
              <SelectTrigger id="vehicle-select">
                <SelectValue placeholder="Select Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                   <SelectLabel>Vehicles</SelectLabel>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.engine_type ? `${vehicle.engine_type} ` : ''}
                      {vehicle.specifications?.displacement ? `${vehicle.specifications.displacement}L ` : ''}
                      {vehicle.specifications?.power_kw ? `${vehicle.specifications.power_kw}kW` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled}
            className="w-full md:w-auto"
          >
            Find Compatible Parts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


```

```typescriptreact
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  getChineseBrands,
  getModelsByBrand,
  getVehiclesByModel,
} from "@/lib/db"
import type { Brand, Model, Vehicle } from "@/lib/types"

interface VehicleSelectorProps {
  className?: string
  onComplete?: (selection: {
    brandId: string
    modelId: string
    vehicleId: string
  }) => void
  mode?: "wizard" | "compact" // simple prop to toggle styles if needed, defaulting to wizard card style
}

export function VehicleSelector({
  className,
  onComplete,
  mode = "wizard",
}: VehicleSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for selections
  const [selectedBrand, setSelectedBrand] = React.useState<string>("")
  const [selectedModel, setSelectedModel] = React.useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("")

  // State for data
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])

  // State for loading
  const [loadingBrands, setLoadingBrands] = React.useState(false)
  const [loadingModels, setLoadingModels] = React.useState(false)
  const [loadingVehicles, setLoadingVehicles] = React.useState(false)

  // Fetch Brands on Mount
  React.useEffect(() => {
    async function fetchBrands() {
      setLoadingBrands(true)
      try {
        const data = await getChineseBrands()
        setBrands(data)
      } catch (error) {
        console.error("Failed to fetch brands", error)
      } finally {
        setLoadingBrands(false)
      }
    }
    fetchBrands()
  }, [])

  // Fetch Models when Brand changes
  React.useEffect(() => {
    if (!selectedBrand) {
      setModels([])
      return
    }
    async function fetchModels() {
      setLoadingModels(true)
      try {
        const data = await getModelsByBrand(selectedBrand)
        setModels(data)
      } catch (error) {
        console.error("Failed to fetch models", error)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [selectedBrand])

  // Fetch Vehicles when Model changes
  React.useEffect(() => {
    if (!selectedModel) {
      setVehicles([])
      return
    }
    async function fetchVehicles() {
      setLoadingVehicles(true)
      try {
        const data = await getVehiclesByModel(selectedModel)
        setVehicles(data)
      } catch (error) {
        console.error("Failed to fetch vehicles", error)
      } finally {
        setLoadingVehicles(false)
      }
    }
    fetchVehicles()
  }, [selectedModel])

  // Initialize from URL params if present
  React.useEffect(() => {
    const brandParam = searchParams.get("brand")
    const modelParam = searchParams.get("model")
    const vehicleParam = searchParams.get("vehicleId")

    if (brandParam && brandParam !== selectedBrand) {
        // Validation logic could go here to ensure the brand exists in the fetched list
        // For now we just set it if we have brands loaded or optimistic update
        setSelectedBrand(brandParam)
    }
    if (modelParam && modelParam !== selectedModel) {
        setSelectedModel(modelParam)
    }
    if (vehicleParam && vehicleParam !== selectedVehicle) {
        setSelectedVehicle(vehicleParam)
    }
  }, [searchParams]) // Intentionally only run on mount or param changes, but need to be careful about infinite loops if we update params.

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value)
    setSelectedModel("") // Reset model
    setSelectedVehicle("") // Reset vehicle
    setModels([])
    setVehicles([])
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    setSelectedVehicle("") // Reset vehicle
    setVehicles([])
  }

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value)
  }

  const handleSubmit = () => {
    if (!selectedBrand || !selectedModel || !selectedVehicle) return

    // 1. Emit callback if provided
    if (onComplete) {
      onComplete({
        brandId: selectedBrand,
        modelId: selectedModel,
        vehicleId: selectedVehicle,
      })
    }

    // 2. Update URL params
    const params = new URLSearchParams(searchParams.toString())
    params.set("brand", selectedBrand)
    params.set("model", selectedModel)
    params.set("vehicleId", selectedVehicle)
    
    // Navigate to products page with filter or just update current URL
    // If we are already on products page, this updates filters.
    // If we are on home page, maybe we want to go to products page?
    // For now, I'll assume we just push the params to the current route or a specific search route.
    // But typically a vehicle selector on home page sends you to a results page.
    // I'll check the current path.
    
    const isProductsPage = window.location.pathname.startsWith('/products') || window.location.pathname.startsWith('/oil-selector')
    
    if (!isProductsPage) {
        router.push(`/products?${params.toString()}`)
    } else {
        router.push(`?${params.toString()}`)
    }
  }

  const isSubmitDisabled = !selectedBrand || !selectedModel || !selectedVehicle

  return (
    <Card className={cn("w-full max-w-3xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>Find Parts for Your Vehicle</CardTitle>
        <CardDescription>
          Select your vehicle to see compatible parts and oils.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Step 1: Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand-select">Brand</Label>
            <Select
              value={selectedBrand}
              onValueChange={handleBrandChange}
              disabled={loadingBrands}
            >
              <SelectTrigger id="brand-select">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Brands</SelectLabel>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Model */}
          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <Select
              value={selectedModel}
              onValueChange={handleModelChange}
              disabled={!selectedBrand || loadingModels}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                   <SelectLabel>Models</SelectLabel>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} {model.year_start ? `(${model.year_start}-)` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Vehicle (Engine/Spec) */}
          <div className="space-y-2">
            <Label htmlFor="vehicle-select">Engine / Type</Label>
            <Select
              value={selectedVehicle}
              onValueChange={handleVehicleChange}
              disabled={!selectedModel || loadingVehicles}
            >
              <SelectTrigger id="vehicle-select">
                <SelectValue placeholder="Select Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                   <SelectLabel>Vehicles</SelectLabel>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.engine_type ? `${vehicle.engine_type} ` : ''}
                      {vehicle.specifications?.displacement ? `${vehicle.specifications.displacement} ` : ''}
                      {vehicle.specifications?.battery ? `${vehicle.specifications.battery} ` : ''}
                      {vehicle.specifications?.power ? `${vehicle.specifications.power}` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled}
            className="w-full md:w-auto"
          >
            Find Compatible Parts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


```

I have implemented the `VehicleSelector` wizard component and the necessary shadcn primitives (`Select`, `Label`).

**Summary of Changes:**
1.  **Created `components/vehicle-selector.tsx`:**
    *   Implements a 3-step wizard (Brand → Model → Vehicle).
    *   Fetches data dynamically using `lib/db.ts` (`getChineseBrands`, `getModelsByBrand`, `getVehiclesByModel`).
    *   Manages state for selections and loading.
    *   Updates URL search params (`brand`, `model`, `vehicleId`) and executes an optional `onComplete` callback.
    *   Handles EV-specific specifications (Battery, Power) in the display.

2.  **Created Shadcn Primitives:**
    *   `components/ui/select.tsx`: Full implementation using `@radix-ui/react-select`.
    *   `components/ui/label.tsx`: Implementation using `@radix-ui/react-label`.

**File Structure:**
```text
my-new/
├── components/
│   ├── vehicle-selector.tsx  (New: Wizard logic)
│   └── ui/
│       ├── label.tsx         (New: Label primitive)
│       └── select.tsx        (New: Select primitive)
```

**Usage Example:**
You can now use the component in any page (e.g., `app/page.tsx`) like this:

```tsx
import { VehicleSelector } from "@/components/vehicle-selector"

export default function Page() {
  return (
    <div className="container py-10">
      <VehicleSelector 
        onComplete={(selection) => console.log("Selected:", selection)} 
      />
    </div>
  )
}


```plaintext
my-new/
├── components/
│   ├── vehicle-selector.tsx  (New: Wizard logic)
│   └── ui/
│       ├── label.tsx         (New: Label primitive)
│       └── select.tsx        (New: Select primitive)
```

```typescriptreact
import { VehicleSelector } from "@/components/vehicle-selector"

export default function Page() {
  return (
    <div className="container py-10">
      <VehicleSelector 
        onComplete={(selection) => console.log("Selected:", selection)} 
      />
    </div>
  )
}
```

```

---

**User**

Okey please review and test the task you just did using the browser. 

