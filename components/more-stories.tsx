import PostPreview from './post-preview'
import Container from './container'

export default function MoreStories({ posts }) {
  return (
    <Container>
      <section className='mx-1'>
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
          {posts.map(({ node }) => (
            <PostPreview
              key={node.slug}
              title={node.title}
              coverImage={node.featuredImage}
              date={node.date}
              author={node.author}
              slug={node.slug}
              excerpt={node.excerpt}
            />
          ))}
        </div>
      </section>
    </Container>
  )
}
