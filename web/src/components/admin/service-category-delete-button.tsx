"use client";

import { Trash2 } from "lucide-react";
import { deactivateServiceCategoryAction } from "@/app/admin/categorias-servicos/actions";
import { Button } from "@/components/ui/button";

export function ServiceCategoryDeleteButton() {
  return (
    <Button
      type="submit"
      formAction={deactivateServiceCategoryAction}
      variant="outline"
      onClick={(event) => {
        if (
          !window.confirm(
            "Tem certeza? Categorias em uso serão desativadas; categorias sem vínculos serão removidas.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
      Desativar ou remover
    </Button>
  );
}
