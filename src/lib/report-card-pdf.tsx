import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export type ReportCardPdfData = {
  studentName: string;
  nis?: string | null;
  nisn?: string | null;
  programName?: string | null;
  termName: string;
  academicYearName: string;
  homeroomNote?: string | null;
  entries: {
    subject: string;
    finalScore: number;
    predicate: string;
    description?: string | null;
  }[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  title: { fontSize: 16, textAlign: "center", marginBottom: 4, fontWeight: "bold" },
  subtitle: { fontSize: 11, textAlign: "center", marginBottom: 16, color: "#475569" },
  section: { marginBottom: 12 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 110, color: "#475569" },
  value: { flex: 1, fontWeight: "bold" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0d9488",
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  colSubject: { flex: 3 },
  colScore: { flex: 1, textAlign: "center" },
  colPredicate: { flex: 1, textAlign: "center" },
  note: { marginTop: 12, fontSize: 10, color: "#334155" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#94a3b8" },
});

function ReportCardDocument({ data }: { data: ReportCardPdfData }) {
  return (
    <Document title={`Rapor ${data.studentName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>RAPOR HASIL BELAJAR</Text>
        <Text style={styles.subtitle}>
          Tahun Ajaran {data.academicYearName} — Semester {data.termName}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NIS</Text>
            <Text style={styles.value}>{data.nis ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NISN</Text>
            <Text style={styles.value}>{data.nisn ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Program</Text>
            <Text style={styles.value}>{data.programName ?? "-"}</Text>
          </View>
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.colSubject}>Mata Pelajaran</Text>
            <Text style={styles.colScore}>Nilai</Text>
            <Text style={styles.colPredicate}>Predikat</Text>
          </View>
          {data.entries.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.colSubject}>Belum ada nilai yang dipublikasikan.</Text>
              <Text style={styles.colScore}>-</Text>
              <Text style={styles.colPredicate}>-</Text>
            </View>
          ) : (
            data.entries.map((entry, index) => (
              <View style={styles.tableRow} key={`${entry.subject}-${index}`}>
                <Text style={styles.colSubject}>{entry.subject}</Text>
                <Text style={styles.colScore}>{entry.finalScore}</Text>
                <Text style={styles.colPredicate}>{entry.predicate}</Text>
              </View>
            ))
          )}
        </View>

        {data.homeroomNote ? (
          <Text style={styles.note}>Catatan Wali Kelas: {data.homeroomNote}</Text>
        ) : null}

        <Text style={styles.footer}>
          Dokumen dihasilkan otomatis oleh SigmaLab.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReportCardPdf(
  data: ReportCardPdfData
): Promise<Buffer> {
  return renderToBuffer(<ReportCardDocument data={data} />);
}
