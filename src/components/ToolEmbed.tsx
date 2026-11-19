import type { Lesson } from "../data/types";
import CandleChart from "./CandleChart";
import Simulator from "./Simulator";
import {
  CompoundingCalculator, EmergencyFundCalculator, InflationCalculator, LumpSumCalculator,
  RetirementCalculator, RiskRewardCalculator, SipCalculator,
} from "./Calculators";

export default function ToolEmbed({ tool }: { tool: NonNullable<Lesson["tool"]> }) {
  switch (tool) {
    case "sip": return <SipCalculator />;
    case "lumpsum": return <LumpSumCalculator />;
    case "compound":
    case "wealth3d": return <CompoundingCalculator />;
    case "inflation": return <InflationCalculator />;
    case "emergency": return <EmergencyFundCalculator />;
    case "retirement": return <RetirementCalculator />;
    case "candles": return <CandleChart />;
    case "simulator": return <Simulator />;
    case "riskreward": return <RiskRewardCalculator />;
  }
}
