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

  console.log("VehicleSelector State:", { selectedBrand, selectedModel, selectedVehicle, loadingModels, loadingVehicles, modelsCount: models.length, vehiclesCount: vehicles.length });

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
      console.log("Fetching models for brand:", selectedBrand);
      setLoadingModels(true)
      try {
        const data = await getModelsByBrand(selectedBrand)
        console.log("Models fetched:", data);
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
      console.log("Fetching vehicles for model:", selectedModel);
      setLoadingVehicles(true)
      try {
        const data = await getVehiclesByModel(selectedModel)
        console.log("Vehicles fetched:", data);
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
        setSelectedBrand(brandParam)
    }
    if (modelParam && modelParam !== selectedModel) {
        setSelectedModel(modelParam)
    }
    if (vehicleParam && vehicleParam !== selectedVehicle) {
        setSelectedVehicle(vehicleParam)
    }
  }, [searchParams]) 

  const handleBrandChange = (value: string) => {
    console.log("Brand changed to:", value);
    setSelectedBrand(value)
    setSelectedModel("") // Reset model
    setSelectedVehicle("") // Reset vehicle
    setModels([])
    setVehicles([])
  }

  const handleModelChange = (value: string) => {
    console.log("Model changed to:", value);
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
