import { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { colors } from "../lib/theme";

type Point = { date: string; weight: number };

type Props = {
  data: Point[];
};

const ACCENT_RGB = "255, 122, 0";
const MUTED_RGB = "142, 136, 163";

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ProgressChart({ data }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Silence radio sur cet exercice. Bouge-toi et reviens voir.
        </Text>
      </View>
    );
  }

  const width = Dimensions.get("window").width - 48;
  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View>
      <LineChart
        data={{
          labels: data.map((p) => formatShortDate(p.date)),
          datasets: [{ data: data.map((p) => p.weight) }],
        }}
        width={width}
        height={200}
        yAxisSuffix=" kg"
        bezier
        onDataPointClick={({ index }) => setSelectedIndex(index)}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(${ACCENT_RGB}, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(${MUTED_RGB}, ${opacity})`,
          propsForDots: { r: "4", strokeWidth: "2", stroke: colors.accent },
          propsForBackgroundLines: { stroke: colors.border },
          strokeWidth: 2,
        }}
        style={styles.chart}
      />

      {selected && (
        <Text style={styles.tooltip}>
          {formatShortDate(selected.date)} — {selected.weight} kg
        </Text>
      )}

      <View style={styles.table}>
        {data
          .slice()
          .reverse()
          .map((point) => (
            <View key={point.date} style={styles.tableRow}>
              <Text style={styles.tableDate}>{formatShortDate(point.date)}</Text>
              <Text style={styles.tableWeight}>{point.weight} kg</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
  },
  tooltip: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  empty: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  table: {
    marginTop: 16,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tableWeight: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
