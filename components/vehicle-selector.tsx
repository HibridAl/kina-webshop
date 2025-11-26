"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { getChineseBrands, getModelsByBrand, getVehiclesByModel } from "@/lib/db"
import type { Brand, Model, Vehicle } from "@/lib/types"

interface VehicleSelectorProps {
  className?: string
  onComplete?: (selection: {
    brandId: string
    modelId: string
    vehicleId: string
  }) => void
  mode?: "wizard" | "compact"
}

const stepCopy = [
  {
    id: "brand",
    label: "Select brand",
    description: "MG, BYD, Omoda, Geely, Haval",
  },
  {
    id: "model",
    label: "Choose model",
    description: "Model year + trim",
  },
  {
    id: "vehicle",
    label: "Engine / battery",
    description: "Powertrain & spec",
  },
]

export function VehicleSelector({ className, onComplete }: VehicleSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedBrand, setSelectedBrand] = React.useState<string>("")
  const [selectedModel, setSelectedModel] = React.useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("")

  const [brands, setBrands] = React.useState<Brand[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])

  const [loadingBrands, setLoadingBrands] = React.useState(false)
  const [loadingModels, setLoadingModels] = React.useState(false)
  const [loadingVehicles, setLoadingVehicles] = React.useState(false)

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
    setSelectedBrand(value)
    setSelectedModel("")
    setSelectedVehicle("")
    setModels([])
    setVehicles([])
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    setSelectedVehicle("")
    setVehicles([])
  }

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value)
  }

  const handleSubmit = () => {
    if (!selectedBrand || !selectedModel || !selectedVehicle) return

    if (onComplete) {
      onComplete({
        brandId: selectedBrand,
        modelId: selectedModel,
        vehicleId: selectedVehicle,
      })
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("brand", selectedBrand)
    params.set("model", selectedModel)
    params.set("vehicleId", selectedVehicle)

    const path = window.location.pathname
    const target = path.startsWith("/products") || path.startsWith("/oil-selector")
      ? `?${params.toString()}`
      : `/products?${params.toString()}`

    router.push(target)
  }

  const isSubmitDisabled = !selectedBrand || !selectedModel || !selectedVehicle

  return (
    <div className={cn("space-y-8", className)}>
      <div className="grid gap-4 md:grid-cols-3">
        {stepCopy.map((step, index) => {
          const active =
            (index === 0 && selectedBrand) ||
            (index === 1 && selectedModel) ||
            (index === 2 && selectedVehicle)
          const complete =
            (index === 0 && !!selectedBrand) ||
            (index === 1 && !!selectedModel) ||
            (index === 2 && !!selectedVehicle)
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                active && "border-primary/60 bg-primary/5",
                complete && "shadow-sm"
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-base font-semibold">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 rounded-3xl border border-border/80 bg-background/80 p-4">
          <Label htmlFor="brand-select" className="text-sm font-semibold text-muted-foreground">
            Brand
          </Label>
          <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger id="brand-select" className="rounded-2xl border border-border/60 bg-card/80">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className="rounded-2xl border-border/70">
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

        <div className="space-y-2 rounded-3xl border border-border/80 bg-background/80 p-4">
          <Label htmlFor="model-select" className="text-sm font-semibold text-muted-foreground">
            Model
          </Label>
          <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand || loadingModels}>
            <SelectTrigger id="model-select" className="rounded-2xl border border-border/60 bg-card/80">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className="rounded-2xl border-border/70">
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

        <div className="space-y-2 rounded-3xl border border-border/80 bg-background/80 p-4">
          <Label htmlFor="vehicle-select" className="text-sm font-semibold text-muted-foreground">
            Powertrain / spec
          </Label>
          <Select value={selectedVehicle} onValueChange={handleVehicleChange} disabled={!selectedModel || loadingVehicles}>
            <SelectTrigger id="vehicle-select" className="rounded-2xl border border-border/60 bg-card/80">
              <SelectValue placeholder="Select spec" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className="rounded-2xl border-border/70">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Drop in your OEM reference afterwards to auto-cross check compatibility.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="rounded-full">
            Find compatible parts
          </Button>
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/oil-selector" className="inline-flex items-center gap-2">
              Oil & fluids matrix
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
