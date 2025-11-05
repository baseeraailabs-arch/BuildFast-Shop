import Card from '@components/ui/Card'

const HomePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to BuildFast Shop
        </h1>
        <p className="text-xl text-gray-600">
          Your e-commerce platform is ready to be built!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <h3 className="text-xl font-semibold mb-2">Products</h3>
          <p className="text-gray-600">
            Browse our collection of quality products
          </p>
        </Card>

        <Card hover>
          <h3 className="text-xl font-semibold mb-2">Shopping Cart</h3>
          <p className="text-gray-600">
            Easy checkout and secure payments
          </p>
        </Card>

        <Card hover>
          <h3 className="text-xl font-semibold mb-2">Account</h3>
          <p className="text-gray-600">
            Manage your orders and profile
          </p>
        </Card>
      </div>
    </div>
  )
}

export default HomePage
