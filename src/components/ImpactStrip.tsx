interface ImpactItem {
  value: string;
  label: string;
}

interface ImpactStripProps {
  items: ImpactItem[];
}

const ImpactStrip = ({ items }: ImpactStripProps) => {
  return (
    <div className="flex items-center justify-around rounded-lg bg-secondary/10 px-4 py-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-lg font-bold text-secondary">{item.value}</span>
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ImpactStrip;
