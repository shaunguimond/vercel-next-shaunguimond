import Image from "next/image"

export default function Avatar({ author }) {
  const node = author?.node
  const name =
    node?.firstName && node?.lastName
      ? `${node.firstName} ${node.lastName}`
      : node?.name || null
  const avatarUrl = node?.avatar?.url

  // A post can have no author or avatar — fall back to a placeholder.
  if (!avatarUrl) {
    return (
      <div className="flex items-center">
        <div className="w-9 h-9 relative mr-4 rounded-full bg-gray-300" />
        {name && <div className="text-xl font-bold">{name}</div>}
      </div>
    )
  }

  return (
    <div className="flex items-center">
      <div className="w-9 h-9 relative mr-4">
        <Image
          src={avatarUrl}
          className="rounded-full"
          alt={name}
          fill
          sizes="36px" />
      </div>
      <div className="text-xl font-bold">{name}</div>
    </div>
  );
}
