const CardResponse = ({
  source,
  response,
  onSelect,
}: {
  source: string;
  response: string;
  onSelect: (source: string) => void;
}) => (
  <div
    className="p-4 border rounded shadow cursor-pointer hover:bg-gray-100"
    onClick={() => onSelect(source)}
  >
    <h3 className="text-lg font-bold">{source}</h3>
    <p>{typeof response === 'string' ? response : JSON.stringify(response)}</p>
  </div>
);

export default CardResponse;
