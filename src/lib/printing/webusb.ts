/// <reference types="w3c-web-usb" />
/**
 * Cliente WebUSB para impressoras Zebra/Brother.
 * Apenas Chrome/Edge desktop, requer HTTPS (excepto localhost).
 *
 * Vendor IDs:
 *   0x0A5F — Zebra Technologies
 *   0x04F9 — Brother Industries
 */

const FILTERS: USBDeviceFilter[] = [
  { vendorId: 0x0a5f }, // Zebra
  { vendorId: 0x04f9 }, // Brother
];

export function isWebUSBAvailable(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

export async function requestZebraPrinter(): Promise<USBDevice> {
  if (!isWebUSBAvailable()) {
    throw new Error("WebUSB não está disponível neste navegador.");
  }
  return await (navigator as Navigator & { usb: USB }).usb.requestDevice({
    filters: FILTERS,
  });
}

function findBulkOutEndpoint(device: USBDevice): { ifaceNumber: number; epNumber: number } {
  const cfg = device.configuration;
  if (!cfg) throw new Error("Configuração USB indisponível.");
  for (const iface of cfg.interfaces) {
    const alt = iface.alternate;
    for (const ep of alt.endpoints) {
      if (ep.direction === "out" && ep.type === "bulk") {
        return { ifaceNumber: iface.interfaceNumber, epNumber: ep.endpointNumber };
      }
    }
  }
  throw new Error("Endpoint USB de saída não encontrado.");
}

/**
 * Envia ZPL para a impressora via WebUSB.
 *
 * IMPORTANTE: o número de cópias está embebido no ZPL via `^PQ`
 * (ver `generateZPL`). Fazemos um único `transferOut` — repetir aqui
 * resultaria em `copies × copies` impressões.
 */
export async function printZPLViaUSB(
  device: USBDevice,
  zpl: string,
): Promise<void> {
  await device.open();
  let claimed = -1;
  try {
    if (!device.configuration) {
      await device.selectConfiguration(1);
    }
    const { ifaceNumber, epNumber } = findBulkOutEndpoint(device);
    await device.claimInterface(ifaceNumber);
    claimed = ifaceNumber;
    const data = new TextEncoder().encode(zpl);
    await device.transferOut(epNumber, data);
  } finally {
    if (claimed >= 0) {
      try {
        await device.releaseInterface(claimed);
      } catch {
        /* ignore */
      }
    }
    try {
      await device.close();
    } catch {
      /* ignore */
    }
  }
}
