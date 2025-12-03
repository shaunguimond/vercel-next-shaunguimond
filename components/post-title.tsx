export default function PostTitle({ children }) {
  return (
    <h1
      className="text-3xl md:text-4xl lg:text-4xl font-bold tracking-tighter leading-tight md:leading-none mb-12 text-center"
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}
