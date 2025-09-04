export default function decodeImageFormat (image) {
    
    const type = image.type;
    const format = image.format;
    
    // Decodifica TYPE (profondità di bit)
    const typeMap = {
        1009: { name: "UnsignedByteType", bits: "8-bit", description: "0-255 per canale (LDR)" },
        1010: { name: "ByteType", bits: "8-bit signed", description: "-128 to 127 per canale" },
        1011: { name: "UnsignedShortType", bits: "16-bit unsigned", description: "0-65535 per canale" },
        1012: { name: "ShortType", bits: "16-bit signed", description: "-32768 to 32767 per canale" },
        1013: { name: "UnsignedIntType", bits: "32-bit unsigned", description: "0-4294967295 per canale" },
        1014: { name: "IntType", bits: "32-bit signed", description: "-2147483648 to 2147483647 per canale" },
        1015: { name: "HalfFloatType", bits: "16-bit float", description: "Half-precision floating point (HDR)" },
        1016: { name: "FloatType", bits: "32-bit float", description: "Full-precision floating point (HDR)" },
        1020: { name: "UnsignedShort4444Type", bits: "16-bit packed", description: "4+4+4+4 bit per canale" },
        1021: { name: "UnsignedShort5551Type", bits: "16-bit packed", description: "5+5+5+1 bit per canale" },
        1022: { name: "UnsignedShort565Type", bits: "16-bit packed", description: "5+6+5 bit per canale" },
        1023: { name: "UnsignedInt248Type", bits: "32-bit packed", description: "24-bit depth + 8-bit stencil" }
    };
    
    // Decodifica FORMAT (numero di canali)
    const formatMap = {
        1019: { name: "AlphaFormat", channels: "1 canale", description: "Solo Alpha" },
        1020: { name: "RGBFormat", channels: "3 canali", description: "Red + Green + Blue" },
        1021: { name: "RGBAFormat", channels: "4 canali", description: "Red + Green + Blue + Alpha" },
        1022: { name: "LuminanceFormat", channels: "1 canale", description: "Solo Luminance (grayscale)" },
        1023: { name: "LuminanceAlphaFormat", channels: "2 canali", description: "Luminance + Alpha" },
        1024: { name: "RGBAFormat", channels: "4 canali", description: "Red + Green + Blue + Alpha" }, // Valore alternativo
        1025: { name: "DepthFormat", channels: "1 canale", description: "Depth buffer" },
        1026: { name: "DepthStencilFormat", channels: "2 canali", description: "Depth + Stencil" },
        1027: { name: "RedFormat", channels: "1 canale", description: "Solo Red" },
        1028: { name: "RedIntegerFormat", channels: "1 canale", description: "Red integer" },
        1029: { name: "RGFormat", channels: "2 canali", description: "Red + Green" },
        1030: { name: "RGIntegerFormat", channels: "2 canali", description: "RG integer" },
        1031: { name: "RGBIntegerFormat", channels: "3 canali", description: "RGB integer" },
        1032: { name: "RGBAIntegerFormat", channels: "4 canali", description: "RGBA integer" }
    };
    
    const typeInfo = typeMap[type] || { name: "SCONOSCIUTO", bits: "?", description: `Codice: ${type}` };
    const formatInfo = formatMap[format] || { name: "SCONOSCIUTO", channels: "?", description: `Codice: ${format}` };
    
    console.log("🔍 RISULTATI:");
    console.log(`Tipo (${type}): ${typeInfo.name}`);
    console.log(`  - Profondità: ${typeInfo.bits}`);
    console.log(`  - Descrizione: ${typeInfo.description}`);
    console.log("");
    console.log(`Formato (${format}): ${formatInfo.name}`);
    console.log(`  - Canali: ${formatInfo.channels}`);
    console.log(`  - Descrizione: ${formatInfo.description}`);
    
    // Calcola la configurazione finale
    let totalBitsPerPixel = 0;
    let isHDR = false;
    
    if (type === 1015) { // HalfFloatType
        isHDR = true;
        totalBitsPerPixel = format === 1024 ? 64 : 48; // 4 canali * 16bit o 3 canali * 16bit
    } else if (type === 1016) { // FloatType  
        isHDR = true;
        totalBitsPerPixel = format === 1024 ? 128 : 96; // 4 canali * 32bit o 3 canali * 32bit
    } else if (type === 1009) { // UnsignedByteType
        totalBitsPerPixel = format === 1024 ? 32 : 24; // 4 canali * 8bit o 3 canali * 8bit
    }
    
    console.log("");
    console.log("📊 RIEPILOGO FINALE:");
    console.log(`✨ Tipo: ${isHDR ? 'HDR' : 'LDR'}`);
    console.log(`🎨 Bit totali per pixel: ${totalBitsPerPixel}`);
    console.log(`💾 Formato consigliato per salvataggio: ${isHDR ? 'EXR/HDR (o PNG tone-mapped)' : 'PNG standard'}`);
    
    return {
        type: typeInfo,
        format: formatInfo,
        isHDR: isHDR,
        bitsPerPixel: totalBitsPerPixel
    };
}