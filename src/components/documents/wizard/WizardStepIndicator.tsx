import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WizardStepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function WizardStepIndicator({ steps, currentStep, onStepClick }: WizardStepIndicatorProps) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Passo {currentStep} de {steps.length}</span>
            <span className="font-medium">{Math.round(progress)}% completo</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-between pt-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => onStepClick(step.id)}
                    disabled={step.id > currentStep && !isCompleted}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      isCurrent && "text-primary",
                      isCompleted && "text-success cursor-pointer hover:text-success/80",
                      !isCurrent && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCurrent && "border-primary bg-primary text-primary-foreground",
                      isCompleted && "border-success bg-success text-success-foreground",
                      !isCurrent && !isCompleted && "border-muted-foreground/30"
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    {/* Always show title on mobile, show description on desktop */}
                    <div className="text-left">
                      <p className="text-xs font-medium">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground hidden md:block">{step.description}</p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "hidden sm:block w-8 lg:w-20 h-px mx-1 lg:mx-2",
                      isCompleted ? "bg-success" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
