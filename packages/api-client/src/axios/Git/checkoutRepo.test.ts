import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { checkoutRepo, CheckoutRepoParams } from './checkoutRepo'

let params: CheckoutRepoParams = {
  repoName: 'example',
  branchName: 'example',
}

const mockResponse = { value: 'some-value' }
const server = setupServer(
  rest.post('/git/checkout', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockResponse))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('checkoutRepo', () => {
  it('should return the mocked value when successful', async () => {
    const response = await checkoutRepo(params)
    expect(response).toEqual(mockResponse)
  })

  it('should throw when unsuccessful', async () => {
    server.use(
      rest.post('/git/checkout', (_req, res, ctx) => {
        return res.once(ctx.status(500))
      })
    )

    try {
      await checkoutRepo(params)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})
