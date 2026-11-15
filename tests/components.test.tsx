// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace-provider";
import { EntityEditor } from "@/components/entity-editor";
import { createDemo } from "@/lib/demo";
import type { Workspace } from "@/lib/types";

const close = vi.fn();
function EditorHarness() {
  const { loading } = useWorkspace();
  return loading ? (
    <span>Yükleniyor</span>
  ) : (
    <EntityEditor target={{ entity: "transactions" }} onClose={close} />
  );
}
function mount() {
  return render(
    <WorkspaceProvider demo>
      <EditorHarness />
    </WorkspaceProvider>,
  );
}
function stored(): Workspace {
  return JSON.parse(localStorage.getItem("kasaflow-demo-v1")!) as Workspace;
}
beforeEach(() => {
  localStorage.clear();
  close.mockReset();
  localStorage.setItem("kasaflow-demo-v1", JSON.stringify(createDemo()));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
describe("real transaction form", () => {
  it("saves an unrestricted custom expense name and Turkish amount", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("dialog");
    await user.type(
      screen.getByLabelText("İşlem adı"),
      "Arkadaşlarla Boğaz kahvaltısı",
    );
    await user.type(screen.getByLabelText("Tutar (TL)"), "1.250,50");
    const d = stored();
    await user.selectOptions(
      screen.getByLabelText("Kategori"),
      d.categories.find((c) => c.kind === "expense")!.id,
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(
      stored().transactions.find(
        (t) => t.name === "Arkadaşlarla Boğaz kahvaltısı",
      )?.amount,
    ).toBe(125050);
  });
  it("rejects a zero amount and leaves the data unchanged", async () => {
    const user = userEvent.setup();
    const count = stored().transactions.length;
    mount();
    await screen.findByRole("dialog");
    await user.type(screen.getByLabelText("İşlem adı"), "Geçersiz gider");
    await user.type(screen.getByLabelText("Tutar (TL)"), "0");
    await user.selectOptions(
      screen.getByLabelText("Kategori"),
      stored().categories[0].id,
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "sıfırdan büyük",
    );
    expect(stored().transactions).toHaveLength(count);
    expect(close).not.toHaveBeenCalled();
  });
  it("creates a category inside the form and assigns it immediately", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("dialog");
    await user.type(screen.getByLabelText("İşlem adı"), "Kedi maması");
    await user.type(screen.getByLabelText("Tutar (TL)"), "899,90");
    await user.click(
      screen.getByRole("button", { name: "Yeni kategori oluştur" }),
    );
    await user.type(screen.getByLabelText("Yeni kategori adı"), "Evcil Hayvan");
    await user.click(screen.getByRole("button", { name: "Ekle" }));
    await waitFor(() =>
      expect(
        stored().categories.find((c) => c.name === "Evcil Hayvan"),
      ).toBeDefined(),
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    const d = stored();
    expect(
      d.transactions.find((t) => t.name === "Kedi maması")?.category_id,
    ).toBe(d.categories.find((c) => c.name === "Evcil Hayvan")?.id);
  });
  it("retains one row when save is invoked twice", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("dialog");
    await user.type(screen.getByLabelText("İşlem adı"), "Tek kayıt");
    await user.type(screen.getByLabelText("Tutar (TL)"), "25,01");
    await user.selectOptions(
      screen.getByLabelText("Kategori"),
      stored().categories[0].id,
    );
    await user.dblClick(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      expect(
        stored().transactions.filter((t) => t.name === "Tek kayıt"),
      ).toHaveLength(1),
    );
  });
});
