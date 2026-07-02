using Qaflaty.Application.Catalog.Commands.ImportProducts;

namespace Qaflaty.Api.Common;

/// <summary>
/// Minimal RFC-4180-ish CSV reader for the bulk product import. Handles quoted fields, embedded
/// commas/newlines, and escaped double-quotes (""). Column order is not fixed — the header row is
/// matched by (normalized) name, so merchants can reorder or omit optional columns.
/// </summary>
public static class CsvProductImportParser
{
    public static List<ImportProductRow> Parse(string content)
    {
        var records = ParseRecords(content);
        var rows = new List<ImportProductRow>();
        if (records.Count == 0)
            return rows;

        var header = records[0].Select(NormalizeHeader).ToList();
        int Idx(params string[] aliases) => header.FindIndex(h => aliases.Contains(h));

        var iNameEn = Idx("nameen", "name", "englishname", "productname", "productnameen");
        var iNameAr = Idx("namear", "arabicname", "productnamear");
        var iCatEn = Idx("categoryen", "category", "categoryname", "categorynameen");
        var iCatAr = Idx("categoryar", "categoryarabic", "categorynamear");
        var iPrice = Idx("price");
        var iCompare = Idx("compareat", "compareatprice", "compare", "oldprice", "wasprice");
        var iSku = Idx("sku");
        var iQty = Idx("quantity", "qty", "stock");
        var iStatus = Idx("status");

        for (var r = 1; r < records.Count; r++)
        {
            var cells = records[r];
            if (cells.All(string.IsNullOrWhiteSpace))
                continue; // skip blank lines

            string? Get(int i) => i >= 0 && i < cells.Length ? cells[i] : null;

            rows.Add(new ImportProductRow(
                RowNumber: r + 1, // 1-based file line; header is line 1
                NameEn: Get(iNameEn),
                NameAr: Get(iNameAr),
                CategoryEn: Get(iCatEn),
                CategoryAr: Get(iCatAr),
                Price: Get(iPrice),
                CompareAt: Get(iCompare),
                Sku: Get(iSku),
                Quantity: Get(iQty),
                Status: Get(iStatus)));
        }

        return rows;
    }

    private static string NormalizeHeader(string header)
        => new(header.Trim().ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());

    private static List<string[]> ParseRecords(string content)
    {
        var records = new List<string[]>();
        var current = new List<string>();
        var field = new System.Text.StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < content.Length; i++)
        {
            var c = content[i];

            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < content.Length && content[i + 1] == '"')
                    {
                        field.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    field.Append(c);
                }
                continue;
            }

            switch (c)
            {
                case '"':
                    inQuotes = true;
                    break;
                case ',':
                    current.Add(field.ToString());
                    field.Clear();
                    break;
                case '\r':
                    break; // handled by the paired '\n'
                case '\n':
                    current.Add(field.ToString());
                    field.Clear();
                    records.Add(current.ToArray());
                    current = new List<string>();
                    break;
                default:
                    field.Append(c);
                    break;
            }
        }

        // Flush the trailing field/record (file without a final newline).
        if (field.Length > 0 || current.Count > 0)
        {
            current.Add(field.ToString());
            records.Add(current.ToArray());
        }

        return records;
    }
}
